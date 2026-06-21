# Phase 153: Inglewood Deep-Seed - Research

**Researched:** 2026-06-21
**Domain:** City of Inglewood, CA — reconcile deep-seed (form of government, current roster, headshots, evidence-only stances)
**Confidence:** HIGH (official city site verified; all 5 critical questions resolved)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Backfill `governments.geo_id='0636546'` on gov `af811c4b` (guard `geo_id IS NULL OR geo_id=''`). Merge two duplicate 'City Council' chambers: `a25a6dea` (official_count 5, 3 offices, bidirectional) = SURVIVOR; `8b99bcf0` (official_count NULL, 3 offices, one-directional) = DOOMED. Move-then-delete. Repair 3 one-directional links (Butts `f5775ca1`, Eloy-Jr `ff97a6bb`, Dotson `3e73448b` — `offices.politician_id` set, `politicians.office_id` NULL).
- **D-01b (Eloy dedup):** Keep `666263` (bidirectional, 0 img, survivor); migrate `-201081` headshot to `666263`; unlink-not-delete `-201081`. **Research confirmed same person** (see Critical Finding 3 below).
- **D-02 (by-district + directly-elected Mayor — research verdict required):** RESEARCH MUST verify form of government before committing.
- **D-03 (current-seated):** Treat DB roster as SUSPECT; verify against official site; unlink-not-delete any departed.
- **D-04 (headshots):** Dedup Faulk's 2 images → 1; migrate Eloy photo; verify all for correct person / 600×750 / no superimposed graphics; fill gaps.
- **Wave 4:** Evidence-only CHAIRS model; 100% citation; no defaulted values; no judicial-* topics; ONE agent at a time; all 6 current officials greenfield.
- **Migration ledger:** Structural migs register in schema_migrations; headshot+stance migs AUDIT-ONLY. Next migration = 1018 (on-disk authoritative; pre-flight re-confirms both MAX values). Commit files to EV-Accounts repo via `git -C "C:/EV-Accounts"`.
- **Verdict bar:** Structure-hard / data-soft. Correct government + single chamber + correct roster/form-of-government + Eloy dedup is the hard requirement; headshot gaps and thin stance coverage are acceptable documented gaps.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152 idempotent patterns), survivor-chamber mechanics, shared-district split mechanics, per-member stance chairs, which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- Inglewood Unified School District (gov `3c4c8dca`) — separate government.
- Split-section check post-reconcile (expect 0 rows; Inglewood is NOT in the `project_split_section_defects_5_cities` set).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 157 (Wave-2 close-out) consumes Inglewood's final per-city counts.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INGL-01 | City of Inglewood (geo_id 0636546) deep-seeded — government + roster + headshots + evidence-only stances | Form of government confirmed (by-district D1–D4 + directly-elected Mayor); full current roster verified; headshot URLs identified + WAF status confirmed NO-WAF; stance source landscape documented |
</phase_requirements>

---

## Summary

**Critical Finding 1 — Form of Government (D-02 RESOLVED):** Inglewood uses by-district elections for its four City Council seats (Districts 1–4), each representing a distinct geographic district. The Mayor is directly elected citywide — confirmed across multiple official sources including the Mayor's biography page (citing specific vote percentages in citywide races) and the city's own District pages. This matches the El Monte (Phase 151) / Lancaster / Pasadena model: `LOCAL_EXEC` Mayor + four `LOCAL` district council seats. DB's At-Large labels on the four council rows are WRONG and must be relabeled to District 1–District 4. [VERIFIED: cityofinglewood.org/574, /587, /592, /596, /820]

**Critical Finding 2 — Current Roster (D-03 RESOLVED):** All five currently-seated officials confirmed against the official city site. George Dotson was DEFEATED in the March 2023 District 1 runoff by Gloria Gray — he left office in 2023 and must be unlinked. The full current roster (post-dedup) is: Mayor James T. Butts Jr. (LOCAL_EXEC) + Gloria Gray (D1) + Alex Padilla (D2) + Eloy Morales Jr. (D3) + Dionne Faulk (D4). Note: Gloria Gray has been excused from meetings since December 2025 due to health, but her seat is NOT vacant — she is still the seated D1 councilmember. [VERIFIED: cityofinglewood.org district pages + wavepublication.com March 2023 runoff result]

**Critical Finding 3 — Eloy Morales Dedup (D-01b RESOLVED):** The DB's two records — "Eloy Morales Jr." (-201081, `ff97a6bb`, one-directional, 1 image) and "Eloy Morales" (666263, `6ed19c10`, bidirectional, 0 images) — ARE the same person. The official city District 3 page identifies the current officeholder as "Eloy Morales, Jr., City Councilman - District 3" with email EMorales@CityofInglewood.org and phone 310-412-8603. He has served continuously since April 1, 2003. The dedup proceeds as planned: keep 666263 as survivor, migrate the -201081 headshot, unlink -not-delete -201081. [VERIFIED: cityofinglewood.org/592/District-3]

**Critical Finding 4 — Headshot Sources + WAF Status:** cityofinglewood.org is NO-WAF — direct `curl` to `/ImageRepository/Document?documentID=NNNN` returns HTTP 200 image/jpeg for all tested IDs. All five current officials have accessible official portraits on the city site. This is the same CivicEngage ImageRepository pattern as West Covina (152). No operator in-browser bypass needed. [VERIFIED: curl HTTP 200 tests]

**Critical Finding 5 — Stance Sources:** The Inglewood council votes nearly unanimously (~580 of 583 items) so individual differentiation requires extra effort; Butts (since 2011) and Padilla (since 2013) have the richest record. Rent regulation is well-evidenced (unanimous 2023 RSO permanence vote; Butts championed it). Immigration: all four members made public statements (Padilla/Faulk/Morales expressed sympathy; no formal sanctuary vote or fund — honest blank on any action-based score). Public safety: Butts's 70% crime-reduction narrative is documented, but individual council vote records on policing are thin.

**Primary recommendation:** Proceed with the full 4-wave reconcile. The research-blocked questions from D-02/D-03/D-01b are all resolved. District map: Gray D1, Padilla D2, Morales Jr. D3, Faulk D4. George Dotson = UNLINK. Inglewood is city with a directly-elected Mayor plus 4 district council seats, total 5 offices. official_count = 4 (council only, Mayor excluded per El Monte convention).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber merge, districts) | Database / Storage | — | Pure DB reconcile — no API/UI change |
| Roster management (link repair, unlink departed, create new) | Database / Storage | — | Migration SQL only |
| Headshot ingestion (crop, upload, politician_images) | Database / Storage | API / Backend | Supabase Storage upload + DB row insert |
| Stance research + ingestion | Database / Storage | — | inform.politician_answers + inform.politician_context via MCP |
| Browse surfacing (geo_id → officials) | API / Backend | Browser / Client | geo_id backfill enables existing browse routes |

---

## Standard Stack

No new packages are installed in this phase. This phase follows the established migration + Supabase MCP pattern from phases 142–152.

### Migration Toolchain (carried forward, no changes)
| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations directly to production DB |
| PostgreSQL SQL | — | Migration file format (`.sql`); idempotent `DO $$ ... $$ LANGUAGE plpgsql` blocks |
| EV-Accounts git repo | master | Migration file storage and commit tracking |

### Template Migration Files (confirmed present)
| File | Path | Use for Inglewood |
|------|------|-------------------|
| `1010_west_covina_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Dual-chamber-merge + link-repair + by-district relabel + geo_id backfill template |
| `1011_west_covina_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Roster complete (unlink departed, create new if needed) |
| `1000_elmonte_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Directly-elected Mayor `LOCAL_EXEC` keep-as-is + by-district pattern |
| `1001_elmonte_complete.sql` | `C:/EV-Accounts/backend/migrations/` | official_count=N (excludes Mayor) + roster operations |

---

## Package Legitimacy Audit

> Not applicable — this phase installs zero new packages. Migration SQL + Supabase MCP only.

---

## Architecture Patterns

### System Architecture Diagram

```
cityofinglewood.org             Supabase DB (production)
  /ImageRepository/             ┌─────────────────────────────┐
  Document?documentID=NNNN      │  essentials.governments      │
       │ (HTTP 200 NO-WAF)      │    af811c4b  geo_id→0636546  │
       ▼                        │                              │
  curl download                 │  essentials.chambers         │
  4:5 crop → 600×750            │    a25a6dea (SURVIVOR)       │
  Lanczos q90                   │    8b99bcf0 (DOOMED→delete)  │
       │                        │                              │
       ▼                        │  essentials.offices (5)      │
  Supabase Storage              │    Mayor LOCAL_EXEC          │
  politician_photos/            │    D1 Gray / D2 Padilla      │
  {uuid}-headshot.jpg           │    D3 Morales / D4 Faulk     │
       │                        │                              │
       ▼                        │  essentials.politicians (5)  │
  politician_images rows        │    Butts / Gray / Padilla    │
  (audit-only migration)        │    Morales / Faulk           │
                                │                              │
Web sources (stances)           │  inform.politician_answers   │
  joinjamesbutts.com            │  inform.politician_context   │
  cityofinglewood.org/agendas   │    (audit-only migrations)   │
  laist.com, 2urbangirls.com    └─────────────────────────────┘
```

### Recommended Migration File Names (follow 1010/1011 pattern)

```
C:/EV-Accounts/backend/migrations/
├── 1018_inglewood_reconcile.sql    # Wave 1: geo_id + chamber merge + link repair + Eloy dedup + district relabel (STRUCTURAL, registered)
├── 1019_inglewood_complete.sql     # Wave 2: unlink Dotson + verify roster + official_count=4 (STRUCTURAL, registered)
├── 1020_inglewood_headshots.sql    # Wave 3: headshots (AUDIT-ONLY, NOT registered)
└── 1021_inglewood_stances_*.sql    # Wave 4: per-member stances (AUDIT-ONLY, NOT registered, one file per member)
```

### Pattern: Dual-Chamber Merge (proven 149/151/152)
**What:** Move offices from DOOMED chamber to SURVIVOR, then DELETE DOOMED (with empty-check guard).
**When to use:** Whenever two chambers share the same name/slug under one government.
**Key guard:** `ASSERT (SELECT COUNT(*) FROM offices WHERE chamber_id = '<doomed>') = 0` before DELETE.
**Template:** `1010_west_covina_reconcile.sql` lines handling `b1a2c4cb` DOOMED chamber.

### Pattern: One-directional Link Repair (proven 152)
**What:** For offices where `offices.politician_id` is set but `politicians.office_id` is NULL, set the reverse pointer.
**When to use:** The 3 offices in DOOMED chamber `8b99bcf0` (Butts, Eloy-Jr, Dotson) all have this defect.
**SQL:** `UPDATE politicians SET office_id = '<office_uuid>' WHERE id = '<pol_uuid>' AND office_id IS NULL;`

### Pattern: By-District Relabel (proven 146/149/151)
**What:** Change `districts.label` on At-Large district rows to 'District N' + update `district_type` if needed.
**When to use:** DB has At-Large labels; research confirms by-district elections.
**District map for Inglewood:**
  - `ddcd280b` (Eloy 666263 seat) → District 3
  - `35b92278` (Faulk 666264 seat) → District 4
  - `8e9b0c61` (Gray 666261 seat) → District 1
  - Butts seat → stays LOCAL_EXEC 'Inglewood Mayor' (no change needed)
  - DOOMED chamber offices (Eloy-Jr, Dotson) → relabeled during move to survivor before unlink/dedup

**Shared-district check (MANDATORY pre-flight):** Run the shared-district defect query before relabeling. If any two offices in the survivor chamber share the same `district_id`, split them first (create a new district row for the second occupant). [Pattern from 149/152]

### Pattern: Dedup Person + Migrate Photo (D-01b, new for this phase)
**What:** When two DB records represent the same physical person, keep the bidirectional-clean one as survivor, migrate any image rows from the duplicate to the survivor, then unlink-not-delete the dup.
**Steps:**
1. UPDATE `politician_images` SET `politician_id = '<survivor_pol_id>'` WHERE `politician_id = '<dup_pol_id>'`
2. UPDATE `offices` SET `politician_id = NULL` WHERE `id = '<dup_office_id>'`
3. UPDATE `politicians` SET `office_id = NULL` WHERE `id = '<dup_pol_id>'`
4. Do NOT delete the dup politician/image rows.

### Anti-Patterns to Avoid
- **Numbering migrations before pre-flight:** Always re-confirm BOTH on-disk MAX and live `schema_migrations` MAX before assigning 1018/1019. A parallel workstream could advance the counter.
- **Hardcoding compass topic IDs:** Never hardcode retired topic IDs. Query live `inform.compass_stances` at apply time.
- **Scoring from Butts's campaign site alone:** joinjamesbutts.com is campaign material — confirm RSO vote via city ordinance record or council minutes for evidence-anchored stances.
- **Unanimous-vote trap:** The Inglewood council votes 580/583 unanimously; do NOT infer individual stance from a unanimous vote without confirming it represents a genuine directional stance for the CHAIRS model.
- **Inferring immigration stance from statements alone:** Padilla/Faulk/Morales made sympathetic statements but took NO formal vote on a sanctuary policy. Statements alone may not constitute directional evidence; use judgment per chairs model.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber merge | Custom office-move logic | Proven SQL template from 1010_west_covina_reconcile.sql | Idempotent guards already written |
| Headshot fetch | Python/JS scraper | Direct `curl https://www.cityofinglewood.org/ImageRepository/Document?documentID=NNNN` | Site is NO-WAF; curl works |
| District-seat assignment | Manual research guess | The verified district map in this document | Already confirmed against official pages |
| Stance research | Batch all officials at once | One agent at a time | Rate-limit rule from [[feedback_stance_research_one_at_a_time]] |

**Key insight:** The reconcile pattern is now proven across 11 consecutive phases (142–152). Deviate only where Inglewood genuinely differs (Eloy dedup is new; otherwise same pattern).

---

## Critical Research Findings (the 5 blocked questions)

### CQ-1: Form of Government — RESOLVED

**Verdict:** BY-DISTRICT elections for all 4 council seats (Districts 1, 2, 3, 4) + a DIRECTLY-ELECTED citywide Mayor.

The official City of Inglewood website has individual pages for each district (`/574/District-1`, `/587/District-2`, `/592/District-3`, `/596/District-4`) and a separate Mayor's Office (`/491/Mayors-Office`) and Mayor biography page (`/820/Mayor-James-T-Butts--Bio`). The Mayor's bio cites specific citywide vote percentages ("re-elected with over 83% of the votes cast" in 2014, again 2018, 4th term 2022), confirming direct citywide election — not council selection.

End-state DB structure:
- **1 LOCAL_EXEC office:** `offices.title='Mayor'` (or 'Inglewood Mayor'), `district_type='LOCAL_EXEC'` — James T. Butts Jr. KEEP AS-IS.
- **4 LOCAL offices:** `district_type='LOCAL'`, labels 'District 1', 'District 2', 'District 3', 'District 4'.
- `official_count=4` on survivor chamber (council only; Mayor excluded — El Monte 151 convention).

[VERIFIED: cityofinglewood.org/574, /587, /592, /596, /820]

### CQ-2: Current Roster — RESOLVED

**Verified current roster as of June 2026:**

| Role | Name | DB ext_id | DB pol UUID | District | Confirmed Source |
|------|------|-----------|-------------|----------|-----------------|
| Mayor (LOCAL_EXEC) | James T. Butts Jr. | -200740 | `f5775ca1` | — (citywide) | cityofinglewood.org/820 |
| Council D1 | Gloria Gray | 666261 | `7a04bf87` | District 1 | cityofinglewood.org/574 |
| Council D2 | Alex Padilla | (bidirectional in survivor chamber `a25a6dea`? — see note) | — | District 2 | cityofinglewood.org/587 |
| Council D3 | Eloy Morales Jr. | 666263 (survivor) | `6ed19c10` | District 3 | cityofinglewood.org/592 |
| Council D4 | Dionne Faulk | 666264 | `729bc539` | District 4 | cityofinglewood.org/596 |

**IMPORTANT NOTE on Alex Padilla:** The CONTEXT.md DB pre-check lists the 6 offices as: Eloy Morales (666263), Dionne Faulk (666264), Gloria Gray (666261) in the SURVIVOR chamber `a25a6dea`, and in the DOOMED chamber `8b99bcf0`: Mayor Butts (-200740), Eloy Morales Jr. (-201081), George Dotson (-201082). **Alex Padilla is NOT listed in either chamber.** The official city site confirms Padilla is the current District 2 councilmember. This means either: (a) Padilla's office is under a different chamber UUID not captured in the pre-check, OR (b) he is present in the DB under a different record not surfaced in the 6-office listing. **The Wave-1 pre-flight MUST check for Padilla's existence in the DB** (search by name/email APadilla@cityofinglewood.org or query all offices under gov `af811c4b`). If Padilla is already in the DB under a 7th office, the pre-flight must surface him. If he is genuinely absent, he must be created fresh with a new negative ext_id (`-7010xx` scheme).

**George Dotson — CONFIRMED DEPARTED:** Dotson ran for District 1 re-election in November 2022, was sent to a runoff against Gloria Gray, then LOST the March 7, 2023 runoff 35% to 65%. He has not held office since spring 2023. The `-201082` pol/office must be UNLINKED (null both pointers), rows KEPT.

**Gloria Gray — HEALTH ABSENCE NOTE:** Gray has been excused from in-person meetings since December 2025 (health issue). The council voted 4-0 to excuse her through May 2026. Her District 1 seat IS on the November 2026 ballot (she may or may not run for re-election). She remains the CURRENT seated D1 councilmember — do NOT unlink her. She is an active stance-research target (thin record expected due to absences and being a newer member, seated 2023).

[VERIFIED: cityofinglewood.org district pages; wavepublication.com 2023 runoff; thelalocal.org Gloria Gray health article]

### CQ-3: Eloy Morales Dedup — CONFIRMED SAME PERSON

**Verdict:** "Eloy Morales Jr." (ext_id -201081, pol `ff97a6bb`, DOOMED chamber) and "Eloy Morales" (ext_id 666263, pol `6ed19c10`, SURVIVOR chamber) are definitively the SAME person.

Evidence:
- The official city District 3 page `/592/District-3` names the current District 3 councilmember as **"Eloy Morales, Jr., City Councilman - District 3"** with photo documentID 21958.
- He was "elected to serve the 3rd District of Inglewood on April 1, 2003" — continuous service since 2003.
- He ran for and won re-election in the November 5, 2024 general election as "Eloy Morales Jr."
- The two DB records are simply two ingestion events that created duplicate rows for the same real person.

**Wrong-person disambiguation:** The main other "Eloy Morales" in public life is a Spanish hyperrealist painter born 1973 in Madrid — completely unrelated. No political figures named Eloy Morales in Inglewood other than the councilman and his father (Eloy Morales Sr., co-founder of a youth sports program).

**Dedup mechanics:** Keep 666263 (bidirectional, SURVIVOR chamber). Migrate the `-201081` headshot row (`politician_images.politician_id` → `6ed19c10`). Then unlink -201081: null `offices.politician_id` on `7fd55592` and null `politicians.office_id` on `ff97a6bb`. KEEP both pol and photo rows.

[VERIFIED: cityofinglewood.org/592/District-3; ballotpedia.org Eloy Morales Jr. 2024 candidate page]

### CQ-4: Headshot Sources + WAF Status — RESOLVED

**Verdict: cityofinglewood.org is NO-WAF.** Direct `curl` to `/ImageRepository/Document?documentID=NNNN` returns HTTP 200 image/jpeg. All tested documentIDs returned clean images without any 403/redirect/WAF challenge.

This is the same CivicEngage ImageRepository pattern as West Covina (Phase 152 — also NO-WAF). No operator in-browser bypass is needed.

**Official headshot URLs (all verified HTTP 200):**

| Official | District | documentID | Full URL | Notes |
|----------|----------|------------|----------|-------|
| Gloria Gray | D1 | 21642 | `https://www.cityofinglewood.org/ImageRepository/Document?documentID=21642` | Recent portrait "20251118-R5A00006_DVLP" — fresh Nov 2025 |
| Alex Padilla | D2 | 21957 | `https://www.cityofinglewood.org/ImageRepository/Document?documentID=21957` | Official city portrait |
| Eloy Morales Jr. | D3 | 21958 | `https://www.cityofinglewood.org/ImageRepository/Document?documentID=21958` | "Portrait standing in front of city seal" |
| Dionne Faulk | D4 | 21989 | `https://www.cityofinglewood.org/ImageRepository/Document?documentID=21989` | "R5A09969_DVLP-retouch-BLUE" — recent |
| Mayor Butts | Mayor | 20637 | `https://www.cityofinglewood.org/ImageRepository/Document?documentID=20637` | From `/491/Mayors-Office` page |

A second Butts image reference (documentID 20639) exists on his biography page — either may be the higher-quality portrait; test both.

**Faulk dedup note:** CONTEXT.md says Faulk has 2 existing `politician_images` rows. After dedup, the surviving row should be updated to point to the official city portrait (documentID 21989) — verify the two existing images first (may be the same URL twice, or different sources).

**Wrong-person guard:** Inglewood's official city portraits are unambiguous — each is labeled with the official's name and district on the city's own council pages. Low risk of confusion. However, Mayor Butts disambiguation: there is a historical figure named "Wally Butts" (1967 Supreme Court case) and a DC civil rights worker "Jim Butts" — neither are portrait-photo risks. The Inglewood mayor's official portrait from cityofinglewood.org is unambiguous.

**Fallback sources (if city portraits fail inspection):**
- Ballotpedia has candidate photos for Faulk and Morales (2024 election cycle)
- joinjamesbutts.com has professional campaign photos for Mayor Butts
- LA Sentinel has published council member photos

[VERIFIED: curl HTTP 200 tests on all 5 documentIDs]

### CQ-5: Stance Sources — ASSESSED

**Mayor James T. Butts Jr. (richest record — in office since 2011):**
- **Rent regulation:** Championed and signed the RSO in 2019; led council to make it permanent (unanimous vote April 2023); RSO caps annual increases at 5% max (3% + CPI). Strong evidence for rent-regulation stance. [CITED: aagla.org RSO amendments; laist.com/lataco.com RSO articles]
- **Homelessness:** Provides transitional housing; city count went 384 (2023) → 457 (2024) — a real problem. Affordable housing groundbreaking (101 units at Fairview Heights 2020). Responsive but not enforcement-first. [CITED: joinjamesbutts.com accomplishments; nationalcore.org groundbreaking]
- **Economic development:** Unemployment 17.5% (2010) → 4.7% (pre-pandemic); "Inglewood-first" hiring PLAs; pro-stadium development. Strong economic-development stance evidenced. [CITED: joinjamesbutts.com]
- **Public safety:** 70% crime reduction since 1981; $10.7M invested in police; narrative is law-enforcement-positive. However, also voted to destroy police records (ACLU/SB1421 controversy). [CITED: LAist "Judge Orders Inglewood Police" article]
- **Immigration (local-immigration topic):** Made public statements of concern but "had no position on federal immigration operations in general" (Jan 15 interview). No formal sanctuary resolution. Statements are sympathetic but no formal action vote = THIN evidence for chairs placement. [CITED: thelalocal.org immigration response article]
- **Housing (general):** Affordable housing units built; defends rising property values; "43% of affordable units in South Bay built during first 7 years." [CITED: joinjamesbutts.com accomplishments]

**Alex Padilla (in office since 2013):**
- **Economic development:** Consistent advocate for PLAs and union labor; stadium development supporter; poised-for-growth framing. [CITED: CSULAU University Times interview; 2urbangirls.com]
- **Immigration:** Emotional statement ("tears at the heart"), no formal vote. [CITED: thelalocal.org]
- **Rent regulation:** Likely voted yes on RSO permanence (council voted unanimously). Needs minute confirmation.
- Overall: Moderate progressive; thin individual voting record due to unanimous-vote culture.

**Eloy Morales Jr. (in office since 2003):**
- **Immigration:** "Our hands are truly tied. If there's something we could do, we would." Sympathetic, no formal action. [CITED: thelalocal.org]
- **Finance/Housing Authorities:** Serves on Finance Authority, Housing Authority, Parking Authority — positions suggest supportive of city housing initiatives.
- **Rent regulation:** Almost certainly voted yes (unanimous); confirm in minutes.
- Long tenure (20+ years) means more record available but Inglewood's unanimous culture limits differentiation.

**Dionne Faulk (District 4, won re-election Nov 2024):**
- **Immigration:** "Absolutely horrified"; called for change. Sympathetic statements, no formal vote. [CITED: thelalocal.org]
- **Housing/Economic development:** Campaign platform says "sustainable jobs, affordable housing, balanced budget." First African-American woman elected to Inglewood council. Pro-union (PLAs with Padilla). [CITED: Ballotpedia candidate page; search results]
- Thin individual differentiation from unanimous-vote culture.

**Gloria Gray (seated March 2023, in office ~3 years):**
- Newest member; health absences since Dec 2025 limit recent record.
- Campaign platform: public safety, infrastructure, General Plan, "independent-active voice." [CITED: search result from gloriagray4citycouncil.com campaign site]
- Virtually attended Jan/Feb 2026 meetings but no comment on immigration issue. [CITED: thelalocal.org Gray health article]
- Expect thin record → many honest blanks acceptable.

**Unanimous-vote council caveat (critical for stances):** The LAist reported the Inglewood council approved 580 of 583 items unanimously over 2 years. This creates a stance research trap: unanimous votes confirm shared positions but don't differentiate members. For any topic where ALL members are expected to vote the same way (RSO, development agreements), a unanimous vote counts as evidence for EACH member only if the vote reflects a genuine directional stance per the CHAIRS scale. The research agent must apply the chairs framework — "which chair does this evidence match?" — not just "did they vote yes?"

**Stance research order recommendation (richest → thinnest):** Butts → Padilla → Morales Jr. → Faulk → Gray.

**No judicial topics:** Inglewood is a council-manager city with an appointed City Attorney. Zero judicial-* topics for any official.

[CITED: laist.com "Yes, yes and more yes"; joinjamesbutts.com accomplishments; thelalocal.org immigration response; aagla.org RSO; wavepublication.com; cityofinglewood.org district pages]

---

## Common Pitfalls

### Pitfall 1: Alex Padilla Not in the 6-Office Pre-Check
**What goes wrong:** The CONTEXT.md DB pre-check lists exactly 6 offices under two chambers — but Gloria Gray (D1), Eloy Morales (D3), and Faulk (D4) are in the survivor, while Butts (Mayor), Eloy-Jr (D3 dup), and Dotson (D1 departed) are in the doomed. That accounts for 6 offices — but where is Padilla (D2)?
**Why it happens:** Padilla was likely seeded under a third chamber or as a standalone office not visible in the pre-check filter. Or he exists in the DB under a chamber not named 'City Council'.
**How to avoid:** Wave-1 pre-flight MUST execute: `SELECT o.*, p.full_name FROM offices o JOIN politicians p ON p.id = o.politician_id WHERE o.government_id = 'af811c4b-e4da-4f30-ac33-9a7fe7d434ba'` to surface ALL offices under this gov, not just those in the two known chambers.
**Warning signs:** Pre-flight returns only 6 offices and Padilla is not among them → look for him via a politicians name search or create fresh.

### Pitfall 2: Unanimous Vote ≠ Individual Directional Stance
**What goes wrong:** Stance research agent scores Padilla/Morales/Faulk/Gray all "5" on rent-regulation because the RSO permanence vote was unanimous, then flags this as "100% cited."
**Why it happens:** Evidence-exists + vote-confirmed = "verified" in the agent's frame, but the CHAIRS model asks which specific chair the evidence places this person in — the unanimous vote anchors all five officials at the same position.
**How to avoid:** For any topic where ALL officials voted identically, treat as weak differentiation. The RSO vote IS real evidence for rent-regulation placement, but confirm the specific RSO vote record mentions individual names where possible.

### Pitfall 3: Eloy Morales Photo on Wrong Person Record
**What goes wrong:** After dedup, the photo migrated from `-201081` to `666263` is later overwritten by a new official city headshot (documentID 21958) that goes onto `666263` directly — resulting in the old photo row becoming a second/orphan image.
**Why it happens:** Dedup migration migrates the photo; Wave-3 headshot migration inserts the official portrait; now 666263 has 2 images (same person, two sources).
**How to avoid:** In Wave-3 headshot migration, use `ON CONFLICT ... DO UPDATE` or explicitly check if a valid image already exists from the dedup migration before inserting. Only insert if no image yet, OR upsert the official portrait over the migrated one (the official portrait is higher quality).

### Pitfall 4: Shared-District UUID (Pomona/West Covina Defect)
**What goes wrong:** Two or more offices in the survivor chamber share the same `district_id`, causing a split-section defect post-relabel.
**Why it happens:** Original ingestion may have assigned the same At-Large district row to multiple offices.
**How to avoid:** Pre-flight MUST run the shared-district check against the survivor chamber's 3 offices BEFORE relabeling. If shared: create a new district row for the second occupant first, then relabel.

### Pitfall 5: Missing Gloria Gray Health-Absence Context
**What goes wrong:** Stance research agent reports "no record found" for Gray and leaves all blanks, but doesn't note the unusual health-absence context that explains the gap.
**Why it happens:** Search results for Gray show mostly campaign materials from 2023 + recent absence news — thin voting record.
**How to avoid:** Include a note in the context for Gray's stance research that she has been absent since December 2025 and is a newer member (seated March 2023). Thin/blank stances are the expected, acceptable outcome.

---

## Code Examples

### District Page URL Pattern
```
# Official council member page pattern:
https://www.cityofinglewood.org/{page_id}/District-{N}
# District 1: /574/District-1
# District 2: /587/District-2
# District 3: /592/District-3
# District 4: /596/District-4

# Headshot URL pattern (NO-WAF — direct curl works):
https://www.cityofinglewood.org/ImageRepository/Document?documentID={id}
# Gray D1:    documentID=21642
# Padilla D2: documentID=21957
# Morales D3: documentID=21958
# Faulk D4:   documentID=21989
# Butts Mayor: documentID=20637 (or 20639 — test both)
```

### Eloy Dedup + Photo Migration (Wave 1)
```sql
-- Source: proven unlink-not-delete pattern from phases 142-152
-- Step 1: migrate photo from dup (-201081 / ff97a6bb) to survivor (666263 / 6ed19c10)
UPDATE politician_images
SET politician_id = '6ed19c10-7b34-47f0-8705-0d154271e362'  -- Eloy 666263 survivor
WHERE politician_id = 'ff97a6bb-XXXX-XXXX-XXXX-XXXXXXXXXXXX'  -- Eloy-Jr -201081 dup
  AND politician_id IN (
    SELECT id FROM politicians WHERE external_id = -201081
  );

-- Step 2: unlink dup (null both directions)
UPDATE offices SET politician_id = NULL
WHERE id = '7fd55592-XXXX-XXXX-XXXX-XXXXXXXXXXXX';  -- dup office

UPDATE politicians SET office_id = NULL
WHERE external_id = -201081;

-- Resolve all UUIDs by external_id at apply time; the above are illustrative
```

### official_count = 4 (council only, Mayor excluded)
```sql
-- Source: El Monte 151 convention; same for Pasadena, Pomona, Lancaster
UPDATE chambers
SET official_count = 4
WHERE id = 'a25a6dea-7f26-4f5e-bc6a-2a5d321063d5'  -- survivor chamber
  AND (official_count IS NULL OR official_count != 4);
```

### Headshot Image Fetch (NO-WAF)
```bash
# Verified NO-WAF — direct curl works:
curl -L -o gray_d1.jpg \
  "https://www.cityofinglewood.org/ImageRepository/Document?documentID=21642"
# Returns HTTP 200 image/jpeg; no WAF challenge
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assuming all LA-area city sites are WAF-403 | WAF status is per-site; test first | Phases 150-152 | Inglewood NO-WAF (like West Covina) — direct curl works |
| At-Large DB labels accepted as-is | Relabel to by-district if official site confirms districts | Phase 146+ | Inglewood At-Large labels ARE wrong; must relabel D1–D4 |
| Single ingestion record per person | Dedup detection required | Phase 153 (first explicit dedup) | Two records for Eloy Morales → dedup + photo migrate |
| Council-selected rotational Mayor | Directly-elected LOCAL_EXEC Mayor kept as-is | Phase 145 (Lancaster) | Inglewood Mayor Butts is directly-elected; no change to LOCAL_EXEC |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Alex Padilla does NOT appear in the 6-office CONTEXT.md pre-check; he is either in a 3rd DB chamber or absent from DB entirely | CQ-2 roster table | If he IS present in the two known chambers, the pre-flight count changes; if he exists under a 3rd chamber, that chamber needs its own reconcile |
| A2 | The Mayor Butts headshot at documentID 20637 is a high-quality recent portrait (based on /491/Mayors-Office page reference) | CQ-4 headshot table | Could be lower quality; documentID 20639 from bio page is the fallback |
| A3 | Gloria Gray is still the seated D1 councilmember as of June 2026 (health-excused, not removed) | CQ-2 roster | If she vacated the seat after the March 2026 reporting date, a replacement may exist — check official site at apply time |
| A4 | Faulk's 2 existing politician_images rows are both the same person (Faulk) and can be deduped to keep one | D-04 headshots | If one of the 2 rows is an erroneous wrong-person image, the dedup target changes |

**If this table is empty (it is not):** A3 carries the highest operational risk — verify Gray's current seat status at Wave-1 pre-flight time.

---

## Open Questions

1. **Where is Alex Padilla in the DB?**
   - What we know: Official site confirms he is the current D2 councilmember (re-elected 2022). The CONTEXT.md pre-check found only 6 offices under gov `af811c4b` across two named chambers.
   - What's unclear: Is Padilla under a 3rd chamber UUID not named 'City Council'? Is he in the DB at all? Is he one of the 6 but misidentified?
   - Recommendation: Wave-1 pre-flight must query ALL offices under gov `af811c4b` (not filter by chamber name) and surface his full record. If absent from DB: create fresh with ext_id `-7010xx` (check MIN to avoid collision).

2. **Faulk's 2 existing images — are they duplicates of the same photo or two different sources?**
   - What we know: CONTEXT.md says Faulk has 2 politician_images rows.
   - What's unclear: Whether both point to the same source URL (a true duplicate to delete-one) or two different photos (may need to verify which is correct person, correct dimensions).
   - Recommendation: Wave-3 pre-flight: query `SELECT * FROM politician_images WHERE politician_id = '729bc539-...'` and check photo_origin_url for both.

3. **Are the Inglewood council district_id rows shared or distinct?**
   - What we know: West Covina had a shared-district defect (two offices shared one district UUID). Inglewood may have the same defect across its At-Large rows.
   - What's unclear: The actual district_id values for the 3 offices in the survivor chamber are not listed in CONTEXT.md.
   - Recommendation: Mandatory pre-flight shared-district check before any relabeling.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP (`mcp__supabase-local`) | All waves | Confirmed (prior phases) | Live production | psql via EV-Accounts DATABASE_URL |
| curl | Wave 3 headshot download | Confirmed | — | Operator in-browser download |
| cityofinglewood.org ImageRepository | Wave 3 headshots | Confirmed NO-WAF | HTTP 200 verified | Ballotpedia/campaign photos |
| EV-Accounts git repo | Migration commit | Confirmed (master branch) | — | N/A |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Structural Assertions (Wave 1 completion gate)

| Check | SQL Pattern | Expected Result |
|-------|-------------|-----------------|
| geo_id backfilled | `SELECT geo_id FROM governments WHERE id='af811c4b...'` | `'0636546'` |
| Only one 'City Council' chamber | `SELECT COUNT(*) FROM chambers WHERE government_id='af811c4b...' AND name='City Council'` | 1 |
| DOOMED chamber deleted | `SELECT COUNT(*) FROM chambers WHERE id='8b99bcf0...'` | 0 |
| All 5 offices in survivor chamber | `SELECT COUNT(*) FROM offices WHERE chamber_id='a25a6dea...'` | 5 (or 4 if Padilla absent + Mayor moves to its own exec chamber) |
| All offices bidirectional | `SELECT COUNT(*) FROM offices o JOIN politicians p ON p.id=o.politician_id WHERE o.chamber_id='a25a6dea...' AND p.office_id != o.id` | 0 |
| Eloy dup unlinked | `SELECT office_id FROM politicians WHERE external_id=-201081` | NULL |
| Dotson unlinked | `SELECT office_id FROM politicians WHERE external_id=-201082` | NULL |

### Roster Assertions (Wave 2 completion gate)

| Check | Expected |
|-------|----------|
| official_count on survivor chamber | 4 |
| All district labels are 'District N' (not 'At-Large') | D1, D2, D3, D4 for the 4 council offices |
| Mayor office district_type | `LOCAL_EXEC` |
| Exactly 5 active politicians linked | 1 Mayor + 4 council members; no null politician_id on active offices |
| George Dotson: `politicians.office_id` | NULL |

### Split-Section Check (post-Wave-1)

```sql
-- Source: project_split_section_defects_5_cities
-- Run after reconcile; expect 0 rows for Inglewood
SELECT g.name, COUNT(DISTINCT gb.mtfcc) section_count
FROM governments g
JOIN government_bodies gb ON gb.government_id = g.id
WHERE g.id = 'af811c4b-e4da-4f30-ac33-9a7fe7d434ba'
GROUP BY g.name HAVING COUNT(DISTINCT gb.mtfcc) > 1;
```
Expected: 0 rows (Inglewood is not in the known split-section defect set).

### Headshot Assertions (Wave 3 completion gate)

| Check | Expected |
|-------|----------|
| All 5 current officials have exactly 1 `politician_images` row with `type='default'` | 5 rows |
| Eloy 666263 (`6ed19c10`) has 1 image (migrated or new) | 1 |
| Faulk 666264 (`729bc539`) has exactly 1 image (deduped) | 1 |
| Butts, Gray, Padilla each have exactly 1 image | 1 each |
| All images: `photo_origin_url` IS NOT NULL | 5 rows |

### Stance Assertions (Wave 4 completion gate)

| Check | Expected |
|-------|----------|
| All 5 current officials have at least 1 stance | 5 politicians with `COUNT(*) >= 1` in `inform.politician_answers` |
| Zero rows with retired topic IDs | 0 rows with any of the 6 retired IDs from [[project_compass_live_topic_ids]] |
| Zero rows with `judicial-*` topic slugs | 0 |
| All answers have a paired `politician_context` row | COUNT(pa) = COUNT(pc) for these 5 officials |

### Quick Run Command
```sql
-- One-liner health check post-Wave-1:
SELECT 
  (SELECT geo_id FROM governments WHERE id='af811c4b-e4da-4f30-ac33-9a7fe7d434ba') as geo_id,
  (SELECT COUNT(*) FROM chambers WHERE government_id='af811c4b-e4da-4f30-ac33-9a7fe7d434ba') as chamber_count,
  (SELECT official_count FROM chambers WHERE id='a25a6dea-7f26-4f5e-bc6a-2a5d321063d5') as official_count;
-- Expected: geo_id='0636546', chamber_count=1, official_count=4
```

---

## Security Domain

> `security_enforcement` not set in config — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Migration SQL runs via authenticated Supabase MCP session |
| V3 Session Management | No | No session changes in this phase |
| V4 Access Control | No | No new API endpoints |
| V5 Input Validation | Yes (minimal) | SQL migrations use hardcoded UUIDs/ext_ids — no user input; parameterized at apply time |
| V6 Cryptography | No | No new secrets; photo URLs are public |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Wrong-person headshot upload | Integrity | Verify each image against official city page before upload |
| ext_id collision (new politician) | Integrity | Pre-flight MIN(external_id) query before assigning -7010xx |
| Retired compass topic ID | Integrity | Query live `inform.compass_stances` at apply time, never hardcode |

---

## Sources

### Primary (HIGH confidence)
- cityofinglewood.org/574 (District-1 / Gloria Gray) — district assignment + current holder
- cityofinglewood.org/587 (District-2 / Alex Padilla) — district assignment + photo documentID 21957
- cityofinglewood.org/592 (District-3 / Eloy Morales Jr.) — district assignment + photo documentID 21958 + Eloy dedup confirmation
- cityofinglewood.org/596 (District-4 / Dionne Faulk) — district assignment + photo documentID 21989
- cityofinglewood.org/820 (Mayor Butts bio) — directly-elected Mayor confirmation + tenure
- cityofinglewood.org/491 (Mayor's Office) — photo documentID 20637
- cityofinglewood.org/624 (City Council staff directory) — full current roster
- curl HTTP 200 tests on all 5 headshot documentIDs — NO-WAF confirmation

### Secondary (MEDIUM confidence)
- wavepublication.com — George Dotson 2022 runoff → March 2023 defeat (2urbangirls.com cross-confirmed)
- lasentinel.net "Gloria Gray Holds Commanding Lead" — 65%/35% final result
- 2urbangirls.com "Inglewood Councilwoman-elect" (March 2023) — Gray's victory confirmed
- thelalocal.org — Gloria Gray health absences (March 2026 article)
- aagla.org — RSO May 2023 amendments (rent regulation evidence)
- lataco.com — April 2023 unanimous RSO permanence vote
- joinjamesbutts.com/accomplishments-2/ — Mayor Butts's documented positions
- thelalocal.org immigration response — Padilla/Faulk/Morales statements (no formal vote)
- LAist "Yes, yes and more yes" — unanimous-vote culture documentation

### Tertiary (LOW confidence — use with caution for stance research)
- csulauniversitytimes.com — Padilla economic development framing (single source)
- laist.com "Judge Orders Inglewood Police" — Butts/public safety record context
- 2urbangirls.com/2024/02 council conflict-of-interest vote — single item

---

## Metadata

**Confidence breakdown:**
- Form of government (by-district + directly-elected Mayor): HIGH — verified via 5 distinct official city pages
- Current roster (George Dotson departed, Gloria Gray seated): HIGH — multiple sources cross-confirm runoff result
- Eloy Morales dedup (same person): HIGH — official city D3 page unambiguous
- WAF status (NO-WAF): HIGH — curl HTTP 200 verified on all 5 image IDs
- Alex Padilla location in DB: LOW — absent from CONTEXT.md 6-office list; status unknown until Wave-1 pre-flight
- Stance depth (Butts richest, Gray thinnest): MEDIUM — general stance evidence confirmed; granular vote-by-vote record not fully mined
- Faulk 2-image dedup target: LOW — need to query both rows to determine dedup strategy

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (Inglewood council is stable; next elections Nov 2026 for D1/D2 but no changes until then; Gloria Gray's seat status the most time-sensitive flag)
