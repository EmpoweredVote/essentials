# Phase 151: El Monte deep-seed - Research

**Researched:** 2026-06-21
**Domain:** City of El Monte, CA — reconcile partial seed, form-of-government verification (BY-DISTRICT confirmed), current 7-member roster, headshots (NO WAF), stance evidence
**Confidence:** HIGH (form of government + roster + WAF status all verified against official city site); MEDIUM (stance evidence depth, per-member)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Reconcile existing seed (backfill geo_id on gov `f5fe3651`; merge two duplicate 'City Council' chambers into one via move-then-delete; idempotent SQL). NOT greenfield. Wave-1 STOP-on-drift pre-flight required.
- D-02: Form-of-government DEFERRED TO RESEARCH with default "stay At-Large + keep directly-elected LOCAL_EXEC Mayor." **Research has resolved this — see D-02 Resolution below. The default is PARTIALLY correct (keep LOCAL_EXEC Mayor) but the At-Large label is WRONG — El Monte is BY-DISTRICT (Districts 1-6).**
- D-03: Verify and reconcile roster against elmonteca.gov; unlink-not-delete departed members; set official_count to verified council size.
- D-04: Verify existing 6 headshots (all have 1 pre-existing image); re-source only those that fail quality/dimension check; try direct curl from city site first (WAF status was UNKNOWN — now CONFIRMED NO WAF).
- Structural migrations register in `schema_migrations`; headshot + stance migrations are AUDIT-ONLY.
- Evidence-only CHAIRS model stances; NO judicial-* topics (council-manager city); ONE research agent at a time.

### Claude's Discretion
- Survivor-chamber choice, exact reconcile SQL ordering (follow 147/149/150 idempotent patterns), per-member stance chairs, dedupe mechanics, and which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- El Monte City School District (gov `e46a6c1e`), South El Monte (`71d17594`), El Monte Union High (`0f1a5895`) — separate governments.
- Split-section check post-reconcile (expect 0 rows for El Monte proper — run to confirm).
- Phase 157 (Wave-2 close-out) consumes El Monte's final per-city counts.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ELMN-01 | El Monte (0622230) deep-seeded — government + roster + headshots + evidence-only stances | Form of government verified (6 BY-DISTRICT seats + directly-elected Mayor = 7-seat body); full current roster identified (Ancona + 6 council members); WAF absent confirmed (all images curl-accessible); stance evidence scouted per member |
</phase_requirements>

---

## Summary

El Monte is a **council-manager city** with a **directly-elected citywide Mayor** (LOCAL_EXEC) **and six by-district council seats (Districts 1-6)** — a 7-seat body total. This structure was enacted via Ordinance No. 3010 (April 5, 2022) as part of a California Voting Rights Act (CVRA) compliance change from the prior at-large 5-seat model. The CONTEXT.md default ("stay At-Large") is **WRONG** for the council seats — the council is now BY-DISTRICT. The Mayor model (directly-elected citywide, LOCAL_EXEC) is **CONFIRMED CORRECT** and must be kept.

The DB currently has 5 at-large council rows + 1 directly-elected Mayor row = 6 seats, in two duplicate chambers. The real roster is 6 district council rows + Mayor = 7 seats. This means: (1) all 5 existing 'At-Large' district labels must be relabeled to their confirmed districts (D1 Crippen-Thomas, D2 Herrera, D3 Ruedas, D4 Longoria, D5 Galvan), (2) a new District 6 seat must be created and Marisol Cortez (no existing politician row in DB) must be seeded into it, and (3) the Mayor's row (Ancona, -200669, LOCAL_EXEC) stays as-is — it is correctly modeled.

The official city site is `ci.el-monte.ca.us` (not `elmonteca.gov` — that domain is an alias/redirect to the same CivicEngage CMS). Headshots are served via `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=NNNN` and **all 7 are HTTP 200 directly via curl** — no WAF blocking. All 7 image document IDs are confirmed.

**Primary recommendation:** Execute as 4 waves following Phase 149 (Pasadena) dual-chamber-merge + 147 (Pomona) by-district patterns. Wave 1: geo_id backfill + chamber merge + relabel At-Large→D1-D5 + create D6 district row. Wave 2: seat Cortez (new politician -700xxx) in D6; set official_count=6 (council only, Mayor not counted). Wave 3: verify and re-source the 6 pre-existing council headshots + add Cortez's new headshot (all 7 curl-accessible). Wave 4: evidence-only stances for all 7 officials.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber merge, district relabels) | Database / Storage | — | Pure data reconcile; no frontend change in this phase |
| Roster management (seat/add officials, relabel districts) | Database / Storage | — | SQL writes to essentials schema; Cortez is a net-new politician row |
| Headshot processing (verify, re-crop if needed, upload) | Local operator pipeline | Supabase Storage | curl from ci.el-monte.ca.us (NO WAF) → verify identity → 4:5 crop → 600×750 Lanczos q90 → Storage upsert |
| Stance ingestion | Database / Storage | — | inform schema inserts via audit-only SQL |
| Browse/compass rendering | Frontend (existing) | API / Backend | No change needed; El Monte renders once geo_id backfilled and single chamber exists |

---

## Standard Stack

This phase uses the same proven stack as Phases 146–150. No new packages.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase MCP (`mcp__supabase-local`) | — | Live DB writes | Production DB access |
| Pillow (Python) | system | Headshot 4:5 crop → 600×750 resize | Established pipeline; Lanczos filter |
| curl | system | Headshot download | CI site is NO WAF — direct curl works |

### Migration Templates
| Template | Location | Use |
|----------|----------|-----|
| `990_downey_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent idempotent reconcile + chamber merge pattern |
| `991_downey_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent roster seat/unlink + new politician creation |
| `946_pasadena_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Dual-chamber merge + district relabel template (Pasadena also had duplicate chambers) |

---

## Package Legitimacy Audit

No new external packages are installed in this phase — the established headshot + stance pipeline is reused.

---

## D-02 Resolution: Form of Government — BY-DISTRICT, NOT AT-LARGE

**Verdict: The CONTEXT.md default ("stay At-Large") is WRONG for council seats. El Monte has BY-DISTRICT council (Districts 1-6). The directly-elected Mayor (LOCAL_EXEC) is CONFIRMED CORRECT.**

### Evidence

1. **Official city site — City Council Election Districting page:** "The City Council approved Map 117, creating six (6) council districts, expanding the City Council seats from five (5) members to seven (7) members. During elections, voters will now elect one member representing their district to the City Council and a Mayor at-large." [VERIFIED: ci.el-monte.ca.us/661/City-Council-Election-Districting — confirmed via WebSearch result text]

2. **Ordinance No. 3010, April 5, 2022:** "Beginning with the November 2022 General Municipal Election cycle, changed the composition of the City Council and the manner in which City Councilmembers are elected to Office." [VERIFIED: ci.el-monte.ca.us/661 content — confirmed via WebSearch snippet]

3. **FAQ page** (`ci.el-monte.ca.us/FAQ.aspx?QID=70`): Lists Mayor Pro Tem Viviana Longoria as "District 4" and all 6 council members by district number. [VERIFIED: direct WebFetch of FAQ page]

4. **City Council page** (`ci.el-monte.ca.us/342/City-Council`): Lists all 7 members. No 'At-Large' labels. [VERIFIED: direct WebFetch]

5. **Mayor directly elected at-large:** "The Mayor, City Clerk and City Treasurer continue to be elected at-large." [VERIFIED: WebSearch result citing ci.el-monte.ca.us/675/2022-ELECTION content + Mid Valley News article on 2024 mayoral race]

6. **2024 Mayoral election results (LA Vote):** Jessica Ancona won 10,935 votes (51.94%) vs. Marisol Cortez 10,120 votes (48.06%) in a direct mayoral election Nov 5, 2024. [VERIFIED: results.lavote.gov/text-results/4324]

**Implementation instruction for planner:** All 5 existing 'At-Large' district rows in the DB must be relabeled to their confirmed district numbers (D1-D5). A new District 6 row must be created. The Mayor's existing LOCAL_EXEC district 'El Monte Mayor' stays unchanged.

---

## D-02 / D-03 Resolution: Full Current Roster (7 seats)

### Confirmed Current Roster (as of 2026-06-21)

| Seat | Person | Title | District | Elected | Term Expires | Source |
|------|--------|-------|----------|---------|--------------|--------|
| Mayor (citywide) | Jessica Ancona | Mayor | LOCAL_EXEC, citywide | Nov 5, 2024 | Nov 2026 | [VERIFIED: ci.el-monte.ca.us/599/Jessica-Ancona + LA Vote 4324] |
| District 1 | Sheila Crippen-Thomas | Councilmember | LOCAL, D1 | Nov 5, 2024 | Nov 2028 | [VERIFIED: ci.el-monte.ca.us/687/Sheila-Crippen-Thomas + LA Vote 4324] |
| District 2 | Martin Herrera | Councilmember | LOCAL, D2 | Nov 2022 | Nov 2026 | [VERIFIED: ci.el-monte.ca.us/643/Martin-Herrera] |
| District 3 | Dr. Julia Ruedas | Councilmember | LOCAL, D3 | Nov 2022 | Nov 2026 | [VERIFIED: ci.el-monte.ca.us/686/Dr-Julia-Ruedas] |
| District 4 | Viviana Longoria | Mayor Pro Tem | LOCAL, D4 | Nov 5, 2024 | Nov 2028 | [VERIFIED: ci.el-monte.ca.us/642/Viviana-Longoria + LA Vote 4324] |
| District 5 | Cindy Galvan | Councilmember | LOCAL, D5 | Nov 5, 2024 | Nov 2028 | [VERIFIED: ci.el-monte.ca.us/348/Cindy-Galvan + LA Vote 4324] |
| District 6 | Marisol Cortez | Councilmember | LOCAL, D6 | Nov 2022 | Nov 2026 | [VERIFIED: ci.el-monte.ca.us/685/Marisol-Cortez; Facebook "Marisol for El Monte District 6"] |

### 2024 Election Results (Districts 1, 4, 5 + Mayor)

| Race | Winner | Votes | % | Runner-up |
|------|--------|-------|---|-----------|
| Mayor (at-large) | Jessica Ancona | 10,935 | 51.94% | Marisol Cortez (challenger) |
| District 1 | Sheila Crippen-Thomas | 2,495 | 56.47% | Jerry Velasco |
| District 4 | Viviana Longoria | 2,262 | 65.04% | Rosalina Nava |
| District 5 | Cindy Galvan | 1,762 | 69.89% | Xiaohu "Jeff" Meng |

[VERIFIED: results.lavote.gov/text-results/4324]

### DB State vs. Reality Gap Analysis

| DB Seeded | DB ext_id | DB Seat | Real District | DB Action |
|-----------|-----------|---------|---------------|-----------|
| Jessica Ancona | -200669 | Mayor, LOCAL_EXEC | Mayor, LOCAL_EXEC citywide | KEEP AS-IS (correctly modeled) |
| Sheila Crippen-Thomas | -201202 | At-Large LOCAL | District 1 | RELABEL district row to 'District 1' |
| Cindy Galvan | -201203 | At-Large LOCAL | District 5 | RELABEL district row to 'District 5' |
| Martin Herrera | -201204 | At-Large LOCAL | District 2 | RELABEL district row to 'District 2' |
| Viviana Longoria | 657386 | At-Large LOCAL | District 4 | RELABEL district row to 'District 4'; note title='Mayor Pro Tem' |
| Julia Ruedas | 657390 | At-Large LOCAL | District 3 | RELABEL district row to 'District 3' |
| **MISSING** | **-700xxx NEW** | — | **District 6** | **CREATE new politician Marisol Cortez + new office + District 6 district row** |

**`official_count` target:** 6 (council seats only; Mayor not counted in official_count, consistent with Pasadena/Pomona precedent).

### DB Chamber Distribution to Reconcile

Current DB distribution (from CONTEXT.md):
- Chamber `5ca38f3a` (official_count NULL) — 4 offices: Crippen-Thomas, Galvan, Herrera, **Ancona (Mayor)**
- Chamber `b41e0065` (official_count 7) — 2 offices: Longoria, Ruedas

**Survivor chamber choice (Claude's Discretion):** Recommend `5ca38f3a` as survivor (it holds the Mayor office). Move Longoria and Ruedas from `b41e0065`, then delete the empty `b41e0065`. After merge, create Cortez's new office into the survivor chamber.

**Note on Ancona's office:** Ancona (-200669, office `57d646fc`) is in chamber `5ca38f3a` with district_type=LOCAL_EXEC and district 'El Monte Mayor'. This is CORRECT — a directly-elected Mayor seat. Do NOT move it or change its district_type. The LOCAL_EXEC district row stays. This is the Lancaster (145) model exactly.

---

## D-04 Resolution: Headshots — WAF Status Confirmed + Image IDs

### WAF Status: NO WAF — All images curl-accessible at HTTP 200

**ci.el-monte.ca.us serves all official council headshots directly via `GET /ImageRepository/Document?documentId=NNNN` with HTTP 200, no authentication required.** [VERIFIED: curl tests of all 7 documentIds returned HTTP 200 in this research session]

This is the same CivicEngage CMS pattern used by Pasadena (cityofpasadena.net — also NO WAF) and Palmdale (cityofpalmdaleca.gov). No operator in-browser workaround needed.

### Image Document IDs (from ci.el-monte.ca.us council pages)

| Member | District | documentId | URL | curl status |
|--------|----------|-----------|-----|-------------|
| Jessica Ancona | Mayor | 7434 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7434` | HTTP 200 |
| Viviana Longoria | D4 | 7430 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7430` | HTTP 200 |
| Marisol Cortez | D6 | 7435 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7435` | HTTP 200 |
| Sheila Crippen-Thomas | D1 | 7431 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7431` | HTTP 200 |
| Cindy Galvan | D5 | 7429 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7429` | HTTP 200 |
| Martin Herrera | D2 | 7432 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7432` | HTTP 200 |
| Dr. Julia Ruedas | D3 | 7433 | `https://www.ci.el-monte.ca.us/ImageRepository/Document?documentId=7433` | HTTP 200 |

[VERIFIED: direct curl HTTP status checks in this research session]

**Note on documentId=4243:** An older Ancona image (documentId=4243) was also found on her individual profile page. Use the City Council page image 7434 (more current) unless testing reveals it is lower-quality than 4243.

### Pre-existing image status (from CONTEXT.md DB pre-check)

All 6 currently-seeded officials already have 1 `politician_images` row each (pre-existing, dimensions **unverified**). Wave 3 task: for each of the 6 existing officials, verify identity + dimensions (must be 600×750). Re-source from city site (documentId above) if wrong dimensions or wrong person. For Marisol Cortez (new), source fresh from city site (documentId=7435).

### Processing Requirements
- Verify identity: confirmed official = correct person in photo, no superimposed text/graphics
- Crop to 4:5 ratio FIRST (never stretch)
- THEN resize to 600×750 via Lanczos filter, q90 JPEG
- Upload to `politician_photos/{uuid}-headshot.jpg` (x-upsert)
- `type = 'default'`, `photo_license` = press_use (official city portrait)
- `photo_origin_url` = full documentId URL

### Fallback Sources (if official portrait is unusable)

| Member | Fallback 1 | Fallback 2 |
|--------|-----------|-----------|
| Ancona | jessicaancona.com (campaign) | Instagram @mayor_ancona |
| Crippen-Thomas | Ballotpedia candidate page | Facebook campaign page |
| Herrera | herreraforelmonte.com campaign | Ballotpedia |
| Ruedas | Ballotpedia | SCAG profile (if available) |
| Longoria | Ballotpedia | Facebook campaign |
| Galvan | Ballotpedia | Facebook campaign |
| Cortez | Ballotpedia | Facebook "Marisol for El Monte" |

---

## D-01 Resolution: Migration Ledger

**On-disk MAX (verified by ls of C:/EV-Accounts/backend/migrations/):** `999_downey_orphan_office_cleanup.sql`
**schema_migrations registered MAX:** Pre-flight MUST re-confirm live MAX before numbering. CONTEXT.md estimated ~1000; Downey ended at 992 registered (999 on-disk). Beware state_exec batches (985-989 on-disk = 5 audit-only files not registered) and prior audit-only migrations that skip registration.
**Next structural migration:** **1000** (first file after 999, assuming no other workstream has advanced the counter overnight).
**Pre-flight MUST re-confirm** both the on-disk MAX and the live `schema_migrations` MAX before writing migration 1000.

### Expected Migration File Structure

```
C:/EV-Accounts/backend/migrations/
├── 1000_elmont_reconcile.sql       # STRUCTURAL: geo_id backfill, chamber merge, relabel At-Large→D1-D5, create D6 district
├── 1001_elmont_complete.sql        # STRUCTURAL: seat Cortez in D6 (new politician), set official_count=6, repair bidirectional links
├── 1002_elmont_headshots.sql       # AUDIT-ONLY: politician_images upserts (verify-first — 6 existing + 1 new)
├── 1003_jessica_ancona_stances.sql # AUDIT-ONLY
├── 1004_crippen_thomas_stances.sql # AUDIT-ONLY
├── 1005_martin_herrera_stances.sql # AUDIT-ONLY
├── 1006_julia_ruedas_stances.sql   # AUDIT-ONLY
├── 1007_viviana_longoria_stances.sql # AUDIT-ONLY
├── 1008_cindy_galvan_stances.sql   # AUDIT-ONLY
└── 1009_marisol_cortez_stances.sql # AUDIT-ONLY
```

Note: Exact numbering subject to pre-flight confirmation. Stance files may be combined per-wave if counter is tight.

---

## Wave 4: Stance Evidence Scout

**Compass model:** CHAIRS (1–5 = discrete position statements, NOT a polarity axis). No judicial topics. Evidence-only; 100% citation required. Blank spoke is honest if no evidence found. One research agent at a time. All 7 officials currently have 0 stances → full greenfield.

**Council-manager context:** El Monte has an appointed City Manager (Alma K. Martinez). No judicial topics apply. Focus on: housing, homelessness, public-safety, local-immigration, economic-development, transportation, rent-regulation.

### Evidence Summary per Member

#### Jessica Ancona (Mayor) — ext_id -200669
**Record depth: MEDIUM-HIGH** (Elected 2020 as Mayor; re-elected 2024 — 6+ years as Mayor; council member before that)

Key documented positions:
- **Public safety:** Strong public safety emphasis in 2024 re-election campaign. [ASSUMED — needs research agent confirmation; campaign site jessicaancona.com]
- **Homelessness:** Likely documented (major issue in SGV cities). [ASSUMED]
- **Local immigration:** Position likely documented (El Monte is heavily Latino). [ASSUMED]

**Note:** Ancona has been mayor since ~2020 — rich record expected. Research agent should mine ci.el-monte.ca.us agenda archives + local news (SGV Tribune, San Gabriel Valley Daily Bulletin).

#### Sheila Crippen-Thomas (D1) — ext_id -201202
**Record depth: LOW-MEDIUM** (elected Nov 2024; thin council voting record at ~7 months tenure)

Seated after Nov 2024 election. Pre-2024 record only if she held prior office. Expect thin record; honest blanks likely.

#### Martin Herrera (D2) — ext_id -201204
**Record depth: MEDIUM** (elected Nov 2022; ~3.5 years on council; supported district elections transition)

Key documented positions:
- **District elections / governance:** Voted FOR district elections in 2022 (one of 3 votes in favor). [CITED: WebSearch result citing election-change coverage]

#### Dr. Julia Ruedas (D3) — ext_id 657390
**Record depth: MEDIUM** (elected Nov 2022; ~3.5 years on council)

Position on issues requires research agent investigation into SGV Tribune, Daily Bulletin, and city council vote records.

#### Viviana Longoria (D4, Mayor Pro Tem) — ext_id 657386
**Record depth: LOW-MEDIUM** (elected Nov 2024; 7 months tenure; previously lost 2024 mayoral race to Ancona as "Marisol Cortez" challenger — NOTE: Longoria is the Mayor Pro Tem, NOT the mayoral challenger — that was Marisol Cortez)

**Seated Nov 2024 — short council record.** Expect thin stances; honest blanks likely.

#### Cindy Galvan (D5) — ext_id -201203
**Record depth: LOW-MEDIUM** (elected Nov 2024; 7 months tenure)

Seated Nov 2024. Thin record; honest blanks likely.

#### Marisol Cortez (D6) — NEW POLITICIAN (must be created, ext_id -700xxx)
**Record depth: MEDIUM-HIGH** (elected Nov 2022; ~3.5 years on council; also ran for Mayor Nov 2024 — documented campaign positions)

Key documented positions:
- **2024 mayoral campaign:** Ran against Ancona on platform of "inclusivity, safety, and revitalization." [CITED: midvalleynews.com/ancona-wins/]
- **Campaign Facebook:** "Marisol for El Monte City Council District 6" (facebook.com/MarisolForElMonte) — campaign positions may be documented there.

Research agent should mine her 2024 mayoral campaign materials + 3.5 years of council vote record.

### Topics Applicable to El Monte Council

El Monte council-manager city → NO judicial topics.

| Topic | Likely applicable | Notes |
|-------|------------------|-------|
| rent-regulation | Yes | SGV tenant pressure; RSO/rent control debates |
| housing | Yes | SCAG RHNA obligations; housing production |
| homelessness | Yes | Major regional issue in SGV |
| homelessness-response | Yes | Enforcement vs. services debate |
| public-safety-approach | Yes | Police funding + community safety |
| local-immigration | Yes | El Monte is heavily immigrant community |
| economic-development | Yes | Business development in post-industrial SGV |
| transportation | Possibly | Metro Gold Line/SGV transit connections |
| residential-zoning | Possibly | Density/upzoning debates |

---

## Architecture Patterns

### System Architecture Diagram

```
ci.el-monte.ca.us (NO WAF — HTTP 200 direct curl)
        |
        v
[Operator: curl documentId URLs → verify identity → 4:5 crop → 600×750 resize]
        |
        v
[Supabase Storage: politician_photos/{uuid}-headshot.jpg]
        |
[inform.politician_answers + politician_context: stance INSERT per member]
        |
[essentials schema writes (structural migrations 1000/1001)]
        |
        v
[Browse + compass UI — El Monte appears via geo_id 0622230 once backfilled + single chamber]
```

### Recommended Project Structure

Follows established 4-wave pattern:

```
C:/EV-Accounts/backend/migrations/
├── 1000_elmont_reconcile.sql       # STRUCTURAL (registered)
├── 1001_elmont_complete.sql        # STRUCTURAL (registered)
├── 1002_elmont_headshots.sql       # AUDIT-ONLY
├── 1003_jessica_ancona_stances.sql # AUDIT-ONLY (one per official)
├── 1004_crippen_thomas_stances.sql # AUDIT-ONLY
├── 1005_martin_herrera_stances.sql # AUDIT-ONLY
├── 1006_julia_ruedas_stances.sql   # AUDIT-ONLY
├── 1007_viviana_longoria_stances.sql # AUDIT-ONLY
├── 1008_cindy_galvan_stances.sql   # AUDIT-ONLY
└── 1009_marisol_cortez_stances.sql # AUDIT-ONLY
```

### Pattern 1: By-District Relabel (Pasadena/Pomona Model)

**What:** Relabel existing 'At-Large' district rows to numbered districts; create new district rows for seats that don't have one.
**When to use:** Any CA city that transitioned from at-large to CVRA districts.
**Example:**
```sql
-- From 946_pasadena_reconcile.sql pattern:
UPDATE essentials.districts
SET label = 'District 1', district_type = 'LOCAL'
WHERE id = '<existing_at_large_district_uuid>'
  AND label = 'At-Large';  -- idempotency guard
```
[VERIFIED: Phase 146 Palmdale, 147 Pomona, 149 Pasadena — standard by-district relabel]

### Pattern 2: Move-Then-Delete Chamber Merge

**What:** Move all offices from doomed chamber into survivor, assert doomed is empty, delete it.
**Example:**
```sql
-- Source: 946_pasadena_reconcile.sql / 990_downey_reconcile.sql
UPDATE essentials.offices SET chamber_id = '<survivor_uuid>'
WHERE chamber_id = '<doomed_uuid>';

DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = '<doomed_uuid>') > 0
  THEN RAISE EXCEPTION 'Doomed chamber not empty — STOP';
  END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = '<doomed_uuid>';
```
[VERIFIED: Phases 146, 147, 149, 150 — standard move-then-delete pattern]

### Pattern 3: Directly-Elected Mayor Kept As-Is (Lancaster Model)

**What:** A directly-elected Mayor seat modeled as LOCAL_EXEC district. Kept unchanged during by-district relabel of council seats.
**When to use:** Any CA city where the Mayor is elected separately (not rotational council selection).
**Implementation:** Mayor's office, LOCAL_EXEC district, and politician_id stay untouched during Wave 1-2. Only council rows get relabeled to D1-D6.
[VERIFIED: Phase 145 Lancaster, 147 Pomona, 148 Torrance — directly-elected Mayor kept as LOCAL_EXEC]

### Anti-Patterns to Avoid
- **Relabeling Mayor's LOCAL_EXEC district to 'District 1-6':** The Mayor is NOT a district seat. Keep district label 'El Monte Mayor' and district_type=LOCAL_EXEC.
- **Treating Marisol Cortez as the mayoral challenger who won:** Cortez LOST the 2024 mayor race (48% to Ancona's 52%). She is the D6 council incumbent (elected 2022). Do NOT confuse these roles.
- **Hardcoding compass topic IDs:** Always query `inform.compass_stances` at apply time; never hardcode retired IDs. Per `project_compass_live_topic_ids`.
- **Guessing district-to-member mapping without pre-flight SELECT:** The current At-Large district UUID → member mapping in DB must be queried before any relabel to avoid swapping district labels.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber deduplication | Custom merge logic | Proven move-then-delete SQL from mig 926/946/990 | Edge cases: bidirectional pointers, foreign key constraints |
| Image cropping | PIL one-liner | Established Pillow pipeline (4:5 crop → 600×750 Lanczos q90) | Aspect ratio enforcement, quality settings |
| Stance insertion | Raw INSERT without conflict handling | `ON CONFLICT (politician_id, topic_id) DO UPDATE` pattern | Idempotency — re-runs must be safe |
| District creation | Hardcoded new UUIDs | `gen_random_uuid()` + SQL guard for uniqueness | Collision prevention |

---

## Common Pitfalls

### Pitfall 1: Confusing Marisol Cortez (D6 council, lost 2024 mayor race) with the Mayor
**What goes wrong:** Research notes say Cortez ran for Mayor in 2024. Planner or implementer might flag her as "stale" or place her in a Mayor role.
**Reality:** Cortez is the **District 6 council incumbent** (elected 2022, term Nov 2026). She ran for Mayor in Nov 2024 and LOST. She retained her D6 seat (she was not up for re-election for D6 in 2024 — D6 was a 2022 election, next up 2026). She is a current council member, NOT a stale member.
**How to avoid:** Clearly distinguish: Mayor race (Ancona won) vs. D6 council seat (Cortez holds, not up for re-election in 2024).

### Pitfall 2: District-to-DB-member mapping requires pre-flight JOIN
**What goes wrong:** Implementer assumes which existing At-Large district UUID belongs to which council member, then relabels incorrectly.
**How to avoid:** Run pre-flight SELECT: `SELECT o.id AS office_id, d.id AS dist_id, d.label, p.first_name, p.last_name, p.external_id FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id JOIN essentials.politicians p ON p.id = o.politician_id WHERE o.chamber_id IN ('5ca38f3a-ea2e-4160-abb5-f897702b6cb6', 'b41e0065-40ed-4486-8ff1-6fe73e0c2532')` to establish the exact district_id UUID for each person before any UPDATE.

### Pitfall 3: official_count includes Mayor vs. does NOT include Mayor
**What goes wrong:** Setting `official_count=7` (all 7 seats) instead of `official_count=6` (council only).
**How to avoid:** Check Pasadena/Pomona precedents — Mayor is in the same chamber but official_count counts council seats only. Set `official_count=6` on the survivor chamber.

### Pitfall 4: Pre-existing headshots may be for wrong person (stale seed)
**What goes wrong:** Accepting pre-existing politician_images rows without checking identity — the original seed may have used incorrect photos.
**How to avoid:** Wave 3 must identity-verify EACH of the 6 pre-existing images against the current official's name + the city site photo before deciding keep-or-replace.

### Pitfall 5: Longoria's office is in the DOOMED chamber (b41e0065)
**What goes wrong:** Implementer deletes the doomed chamber without first moving Longoria (657386) and Ruedas (657390) to the survivor.
**How to avoid:** Move-before-delete pattern is mandatory. Assert doomed chamber is empty before DELETE. Wave 1 migration template from mig 946/990.

### Pitfall 6: Ancona's image documentId=4243 vs 7434
**What goes wrong:** Using the older photo (4243, from her individual profile page header) when the city council page lists 7434 (the current official council photo).
**How to avoid:** Use documentId=7434 (City Council listing photo). Both are HTTP 200 but 7434 is the more current portrait.

### Pitfall 7: ci.el-monte.ca.us vs elmonteca.gov confusion
**What goes wrong:** Implementer fetches from elmonteca.gov and gets a redirect; curl may fail.
**How to avoid:** Use `ci.el-monte.ca.us` as the authoritative host. `elmonteca.gov` is a CivicEngage alias that points to the same CMS but may behave differently with curl redirects. Use the canonical `ci.el-monte.ca.us` domain for all image downloads.

---

## Runtime State Inventory

This is a reconcile/reseat phase, not a rename/refactor. No string-level renames.

**N/A — verified: no stored data key names or OS-registered state change in this phase.**

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| At-large 5-seat El Monte council (pre-2022) | 6 by-district council seats + separately-elected Mayor at-large (post-Ord. 3010, 2022) | Enacted April 2022 for CVRA compliance; first district elections Nov 2022 |
| Rotational Mayor (assumed default for CA general-law cities) | Directly-elected Mayor (El Monte specific) | El Monte elected Mayor separately since at least 2020; Ancona has been Mayor since ~2020 |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Marisol Cortez has no existing politician row in the DB | Roster | If a Cortez row exists (e.g. from the 2024 mayoral race ingestion), we'd create a duplicate — pre-flight SELECT by name required |
| A2 | The 5 existing At-Large district rows map 1:1 to the 5 identified council members (no orphan office rows beyond the Mayor) | Roster | Pre-flight JOIN query will confirm exact mapping; error if count ≠ 5 |
| A3 | All 7 city site headshots (documentId 7429-7435) contain official individual portraits (not group photos, no text overlay) | Headshots | Verify by viewing each image before processing; if a photo fails the identity check, use fallback sources |
| A4 | The on-disk migration counter after pre-flight = 999 (no other workstream has advanced to 1000+ overnight) | Migration | Pre-flight ls of C:/EV-Accounts/backend/migrations/ on execution day; if advanced, renumber accordingly |
| A5 | Marisol Cortez retains her D6 seat (not up for 2024 re-election; term Nov 2022–Nov 2026) | Roster | If she vacated for another reason (resignation etc.) the planner would need to add a D6 vacancy; ci.el-monte.ca.us/342 shows her as current — confirmed |
| A6 | El Monte's appointed City Manager (Alma K. Martinez) means NO judicial-* topics apply to council members | Stances | If El Monte had an elected City Attorney the judicial topics would apply — but council-manager form confirms City Attorney is appointed |

---

## Open Questions

1. **Exact district UUID currently assigned to each council member in DB**
   - What we know: 5 At-Large district UUIDs exist; each council office points to one district_id; Ancona's Mayor office points to the LOCAL_EXEC 'El Monte Mayor' district
   - What's unclear: Which UUID is D1 (Crippen-Thomas) vs D2 (Herrera) etc. before relabeling
   - Recommendation: Pre-flight SELECT (Pitfall 2 query above) in Wave 1 pre-check task; planner should require this as first step of Plan 01.

2. **Marisol Cortez politician row — does any DB row exist?**
   - What we know: She is not listed in CONTEXT.md's DB pre-check (6 offices total, 5 council + Mayor, no Cortez)
   - What's unclear: Whether she was ever seeded (e.g. from a 2022 or 2024 election ingestion pipeline under a different ext_id)
   - Recommendation: Pre-flight `SELECT id, external_id, first_name, last_name FROM essentials.politicians WHERE first_name ILIKE '%marisol%' AND last_name ILIKE '%cortez%'` before creating her row. If found, reuse existing UUID + ext_id.

3. **Next available custom ext_id for Cortez**
   - What we know: -700xxx range in use; Downey's Ortiz used -700991 (aligned to mig 991); next on-disk = 1000
   - What's unclear: Whether any -700xxx values between -700992 and -700999 have been assigned
   - Recommendation: Pre-flight `SELECT MIN(external_id) FROM essentials.politicians WHERE external_id < -700991` to confirm next free slot. Likely **-701000** (aligned to first 4-digit-thousand boundary) or **-700992** (next sequential after -700991).

4. **Mayor Pro Tem title on Longoria's office row**
   - What we know: Viviana Longoria holds Mayor Pro Tem title (confirmed per ci.el-monte.ca.us/342 and FAQ)
   - What's unclear: Whether the DB office row should be `title='Mayor Pro Tem'` or just `title='Councilmember'`
   - Recommendation: Per precedent (Pasadena — Gordo as Mayor has `title='Mayor'`), the active title should be set. Longoria's office should have `title='Mayor Pro Tem'` as it reflects her current role. This is a minor detail; Claude's Discretion per CONTEXT.md.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| curl | Headshot download | Yes | system | — (NO WAF confirmed) |
| Pillow (Python) | Headshot 4:5 → 600×750 | Yes | system | — |
| Supabase MCP (`mcp__supabase-local`) | All DB writes | Yes | — | — |
| ci.el-monte.ca.us direct curl | Headshot source | YES (HTTP 200 confirmed) | — | Campaign/Ballotpedia fallbacks |

**Missing dependencies with no fallback:** None — all requirements met.
**Missing dependencies with fallback:** None.

---

## Validation Architecture

Per project convention, structural migrations are verified immediately post-apply via inline SQL assertions (STOP-on-drift pattern in each migration). Stance and headshot migrations are audit-only and verified by count queries after apply.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | How to Verify |
|--------|----------|-----------|---------------|
| ELMN-01a | `essentials.governments.geo_id = '0622230'` | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id = 'f5fe3651-75c2-4ede-86e2-c13fc008d545'` = '0622230' |
| ELMN-01b | Single 'City Council' chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id = 'f5fe3651-75c2-4ede-86e2-c13fc008d545' AND name = 'City Council'` = 1 |
| ELMN-01c | 7 offices in chamber (6 council + 1 Mayor) | SQL assertion | `SELECT COUNT(*) FROM essentials.offices o WHERE o.chamber_id = '<survivor_uuid>'` = 7 |
| ELMN-01d | official_count = 6 on survivor chamber | SQL assertion | `SELECT official_count FROM essentials.chambers WHERE id = '<survivor_uuid>'` = 6 |
| ELMN-01e | All 7 officials have bidirectional links | SQL assertion | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id WHERE o.chamber_id = '<survivor>'` = 7 AND every p.office_id points back |
| ELMN-01f | Roster matches: Ancona + D1 Crippen-Thomas + D2 Herrera + D3 Ruedas + D4 Longoria + D5 Galvan + D6 Cortez | SQL assertion | `SELECT external_id FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id = p.id WHERE o.chamber_id = '<survivor>'` contains all 7 ext_ids |
| ELMN-01g | District labels correct: D1-D6 + 'El Monte Mayor' | SQL assertion | `SELECT d.label FROM essentials.districts d JOIN essentials.offices o ON o.district_id = d.id WHERE o.chamber_id = '<survivor>'` = {'District 1','District 2','District 3','District 4','District 5','District 6','El Monte Mayor'} |
| ELMN-01h | Headshots present for all 7 officials | SQL count | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (...)` = 7 (or documented honest gaps) |
| ELMN-01i | Stances 100% cited, no defaults | SQL count + manual review | All `inform.politician_answers` rows have paired `politician_context` with source URLs |
| ELMN-01j | Split-section check = 0 rows | SQL assertion | `feedback_section_split_check` query returns 0 rows for geo_id 0622230 |

### Wave 0 Gaps
None — test infrastructure already established from Phases 146–150. No new framework needed.

---

## Security Domain

No new authentication, API endpoints, or data-handling patterns introduced in this phase. Pure DB reconcile + static media upload. Security domain: not applicable.

---

## Sources

### Primary (HIGH confidence)
- `ci.el-monte.ca.us/342/City-Council` — official city council listing (all 7 members, image IDs 7429-7435, emails)
- `ci.el-monte.ca.us/FAQ.aspx?QID=70` — FAQ with district-by-district assignments (D1-D6 confirmed per member)
- `ci.el-monte.ca.us/661/City-Council-Election-Districting` — district creation history (Ord. 3010, April 2022; Map 117; 5→7 seats)
- `ci.el-monte.ca.us/599/Jessica-Ancona` — Mayor profile (directly elected Nov 2024, term Nov 2026)
- `ci.el-monte.ca.us/642/Viviana-Longoria` — D4 profile (elected Nov 2024, term Nov 2028)
- `ci.el-monte.ca.us/643/Martin-Herrera` — D2 profile (elected Nov 2022, term Nov 2026)
- `ci.el-monte.ca.us/685/Marisol-Cortez` — D6 profile (elected Nov 2022, term Nov 2026, documentId=6042/7435)
- `ci.el-monte.ca.us/686/Dr-Julia-Ruedas` — D3 profile (elected Nov 2022, term Nov 2026)
- `ci.el-monte.ca.us/687/Sheila-Crippen-Thomas` — D1 profile (elected Nov 2024, term Nov 2028)
- `ci.el-monte.ca.us/348/Cindy-Galvan` — D5 profile (elected Nov 2024, term Nov 2028)
- `results.lavote.gov/text-results/4324` — Nov 2024 LA County election results (Ancona 51.94%, D1/D4/D5 winners confirmed)
- Curl HTTP 200 tests on all 7 ImageRepository/Document documentIds — WAF status CONFIRMED NO WAF

### Secondary (MEDIUM confidence)
- `midvalleynews.com/ancona-wins/` — Nov 2024 mayor race: Ancona won re-election vs. Cortez (52% vs. 48%)
- `ci.el-monte.ca.us/150/City-Managers-Office` — council-manager form confirmed (City Manager Alma K. Martinez, appointed)
- WebSearch result text quoting city election pages — Ord. 3010 details, "Mayor continues to be elected at-large"

### Tertiary (LOW confidence)
- Training data characterizing El Monte as "five-member at-large council" — OUTDATED as of April 2022; do not rely on

---

## Metadata

**Confidence breakdown:**
- Form of government (6 by-district + citywide Mayor): HIGH — multiple independent official sources confirm; 2022 ordinance + 2024 election results + city FAQ all consistent
- Current roster (all 7 members + districts): HIGH — direct WebFetch of each council member's official profile page
- Stale member identification: HIGH — no stale/departed council members; all 6 DB-seeded council members are current (5 relabeled + 1 new Cortez)
- Headshot sources (NO WAF): HIGH — direct curl tests confirmed HTTP 200 for all 7 documentIds
- Stance evidence: LOW-MEDIUM — stances require research agent per person; 3 members seated Nov 2024 (thin record); 3 members seated Nov 2022 (moderate record); Mayor Ancona since ~2020 (richer record)

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (30 days; next El Monte council election Nov 2026 for D2/D3/D6 + Mayor; no near-term turnover before then)
