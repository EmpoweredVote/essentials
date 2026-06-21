# Phase 152: West Covina deep-seed - Research

**Researched:** 2026-06-21
**Domain:** City of West Covina, CA — reconcile partial seed, form-of-government verification (BY-DISTRICT confirmed, rotational mayor), current 5-member roster, headshots (NO WAF, CivicEngage CMS), stance evidence
**Confidence:** HIGH (form of government + roster + per-district mapping + WAF status all verified against official city site westcovina.gov); MEDIUM (stance evidence depth, per-member)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0684200'` on gov `1982a9fa` (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers (`12c9360a` official_count 5 / 3 offices, bidirectional-clean + `b1a2c4cb` official_count NULL / 2 offices, one-directional) into ONE via move-then-delete (UUID-targeted; assert doomed chamber empty before delete). Follow El Monte (151) / Pasadena (149) dual-chamber merge template. Wave-1 STOP-on-drift pre-flight required.
- **D-01b (repair one-directional links):** Chamber `b1a2c4cb`'s two offices (Rosario Diaz `f5bf4ec4`, Brian Gutierrez `22fc2cdc`) have `offices.politician_id` set but `politicians.office_id` NULL — repair so all 5 seats are bidirectional in the survivor chamber.
- **D-02 (form of government — RESEARCH MUST VERIFY, no default):** **RESOLVED — see D-02 Resolution below. West Covina is BY-DISTRICT (Districts 1–5) with a ROTATIONAL (council-selected) mayor and NO directly-elected mayor office.** The 5 At-Large DB labels are WRONG and must be relabeled to D1–D5. Mayor = a title on a seat, NOT a separate office (so the DB's lack of a Mayor office is CORRECT).
- **D-03 (current-seated, retire departed):** Verify the 5 seeded members against westcovina.gov; unlink-not-delete any departed; set `official_count` to verified council size. New seats created fresh get a new negative ext_id (`-7010xx` scheme).
- **D-04 (verify-first; all 5 already have an image):** Verify each existing image is the correct person, no text/graphics, 600×750. Re-source failures. Try direct curl from westcovina.gov first (WAF status was UNKNOWN — now CONFIRMED NO WAF). Crop 4:5 → 600×750 Lanczos q90; upload `politician_photos/{uuid}-headshot.jpg` x-upsert, `type='default'`, real license + origin URL. Blocking human-verify checkpoint.
- Structural migrations register in `schema_migrations`; headshot + stance migrations AUDIT-ONLY; on-disk counter authoritative; **next migration = 1010**.
- Evidence-only CHAIRS model stances; 100% citation; no defaulted values; honest blanks; ALL compass topics; **NO judicial-* topics** (council-manager); ONE research agent at a time. All 5 = 0 stances → full greenfield.
- COMMIT migration files to EV-Accounts repo (`git -C "C:/EV-Accounts"`).

### Claude's Discretion
- Survivor-chamber choice (prefer cleaner bidirectional `12c9360a`), exact reconcile SQL ordering (follow 146/149/151 idempotent patterns), per-member stance chairs, dedupe mechanics, and which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- West Covina Unified School District (gov `131e33d0`) — separate government.
- Split-section check post-reconcile (expect 0 rows; West Covina is NOT in the split-section-defect set — run to confirm).
- Phase 157 (Wave-2 close-out) consumes West Covina's final per-city counts.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WCOV-01 | West Covina (0684200) deep-seeded — government + roster + headshots + evidence-only stances | Form of government verified (5 BY-DISTRICT seats + rotational council-selected mayor, NO separate mayor office); full current roster confirmed (all 5 DB members current, district map established D1–D5, NO new member needed, NO departures); WAF absent confirmed (all 5 headshot documentIDs curl-accessible HTTP 200); stance evidence scouted per member |
</phase_requirements>

---

## Summary

West Covina is a **council-manager city** with **five by-district council seats (Districts 1–5)** and a **rotational Mayor** — the five council members "annually select one of their members to serve as Mayor." There is **no directly-elected Mayor office**; the Mayor and Mayor Pro Tem are titles held by sitting district councilmembers. The transition to by-district elections was the result of a **CVRA lawsuit (Sanchez v. City of West Covina, LASC BC634674)** settled February 21, 2017; **Ordinance No. 2310 (Jan 17, 2017)** changed West Covina from at-large to a five-district system using Public Plan Map 120, with sequencing electing Districts 2/4/5 in Nov 2018 and Districts 1/3 in Nov 2020. [VERIFIED: westcovina.gov council-districts background + AB-1979 + WebSearch]

This is the cleanest of the recent LA-County deep-seeds: **all 5 DB-seeded members are current and correctly identified — no departures, no missing members, no new politician to create** (unlike El Monte's Cortez). The work is purely (1) reconcile geo_id + merge the two duplicate chambers + repair the two one-directional links, (2) **relabel the 5 'At-Large' district rows to their confirmed districts** (D1 Gutierrez, D2 Lopez-Viado, D3 Diaz, D4 Cantos, D5 Wu) with the rotational Mayor expressed as a title on D2's seat, (3) verify/re-source the 5 pre-existing headshots from the official site, and (4) evidence-only stances for all 5.

The official site is `westcovina.gov` (the `westcovina.org` domain 301-redirects to it). It runs the **CivicEngage CMS** (same as El Monte / Pasadena / Palmdale) and is **NO WAF** — the council page returns full HTML by direct curl and all 5 council portraits are served via `GET /ImageRepository/Document?documentID=NNNN` at HTTP 200. All 5 documentIDs are confirmed and mapped to members. The existing portraits are small (one is 147×190 PNG, others 4–7 KB JPEGs) so re-sourcing + upscaling to 600×750 is expected.

**Primary recommendation:** Execute as 4 waves following the Phase 146 (Palmdale) by-district relabel + Phase 151 (El Monte) dual-chamber-merge patterns. Wave 1: geo_id backfill + chamber merge (survivor `12c9360a`) + relabel At-Large→D1–D5 + repair the two one-directional links. Wave 2 (light — no new members): set `official_count=5`, finalize bidirectional links, set Mayor/Mayor-Pro-Tem titles on the D2/D4 seats. Wave 3: verify + re-source the 5 headshots (documentIDs 1052–1056, all NO-WAF curl). Wave 4: evidence-only stances for all 5.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber merge, district relabels) | Database / Storage | — | Pure data reconcile; no frontend change |
| Roster management (relabel districts, repair links, set titles) | Database / Storage | — | SQL writes to essentials schema; NO net-new politician row this phase |
| Headshot processing (verify, re-crop/upscale, upload) | Local operator pipeline | Supabase Storage | curl from westcovina.gov (NO WAF) → verify identity → 4:5 crop → 600×750 Lanczos q90 → Storage upsert |
| Stance ingestion | Database / Storage | — | inform schema inserts via audit-only SQL |
| Browse/compass rendering | Frontend (existing) | API / Backend | No change; West Covina renders once geo_id backfilled + single chamber exists |

---

## Standard Stack

This phase uses the same proven stack as Phases 146–151. No new packages.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Supabase MCP (`mcp__supabase-local`) | — | Live DB writes (IS production) | Production DB access |
| Pillow (Python) | system | Headshot 4:5 crop → 600×750 resize (Lanczos) | Established pipeline |
| curl | system | Headshot download | westcovina.gov is NO WAF — direct curl works |

### Migration Templates
| Template | Location | Use |
|----------|----------|-----|
| `1000_*el_monte*reconcile*.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent idempotent dual-chamber-merge + At-Large→D relabel reconcile (verify exact filename at plan time) |
| `1001_*el_monte*complete*.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent roster link-repair + official_count template |
| Palmdale 146 reconcile/complete | `C:/EV-Accounts/backend/migrations/` (918/919) | By-district relabel + rotational-mayor-as-title-on-seat pattern (West Covina's exact model) |

> Note: a directory listing of `C:/EV-Accounts/backend/migrations/` in this session showed many `_verify_*` and `generate_*` helper files but the plan-time pre-flight must `ls` to confirm exact El Monte filenames (1000–1009) and the live counter.

---

## Package Legitimacy Audit

No new external packages are installed in this phase — the established headshot + stance pipeline (Pillow, curl, Supabase MCP) is reused. No audit required.

---

## D-02 Resolution: Form of Government — BY-DISTRICT (D1–D5), ROTATIONAL MAYOR, NO separate Mayor office

**Verdict: West Covina has FIVE BY-DISTRICT council seats (Districts 1–5) and a ROTATIONAL Mayor (council members annually select one of their own). There is NO directly-elected Mayor office. The DB's lack of a Mayor office is CORRECT; the 5 'At-Large' labels are WRONG and must be relabeled to D1–D5.** This is the Palmdale (146) / Downey (150) by-district model with a rotational mayor — NOT the Torrance (148) at-large model and NOT the El Monte (151) directly-elected-mayor model.

### Evidence

1. **CVRA transition (Ordinance No. 2310 + Sanchez settlement):** "On January 17, 2017, the City Council adopted Ordinance No. 2310, to change from an at-large election system to a by-district election system, with five districts and a rotating mayor. On February 21, 2017, the City Council approved a settlement agreement in the matter known as Sanchez v. City of West Covina, Los Angeles Superior Court Case No. BC634674 ('CVRA Lawsuit')… The ordinance implementing By-District Elections utilized Public Plan Map 120 and set the election sequencing for the November 2018 (Districts 2, 4 and 5) and November 2020 City Council elections (Districts 1 and 3)." [VERIFIED: westcovina.gov council-districts background page, via WebSearch result text]

2. **State enabling legislation:** AB-1979 "City of West Covina: city council district-based local elections." [CITED: leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=201120120AB1979]

3. **Rotational Mayor — official Elected Officials / Mayor-City-Council pages:** "The five City Council members are elected to overlapping terms of four years and annually select one of their members to serve as Mayor." [VERIFIED: westcovina.gov/172/Mayor-City-Council + /177/Elected-Officials, direct WebFetch]

4. **By-district since Nov 2018:** "in November 2018, the City moved to By-District City Council elections." [VERIFIED: westcovina.gov/172 via WebSearch + WebFetch]

5. **Council-manager form:** "The city operates under a Council-Manager government structure with five council members serving four-year overlapping terms." [VERIFIED: westcovina.gov/172 direct WebFetch] → NO judicial-* topics apply (appointed City Attorney).

**Implementation instruction for planner:** Relabel the 5 existing 'At-Large' district rows to their confirmed districts (D1–D5 per the mapping below). Do NOT create a LOCAL_EXEC Mayor office. Express the Mayor (Lopez-Viado) and Mayor Pro Tem (Cantos) as a `title` on their existing district seats (the Palmdale/Glendale "title on a seat" model). `official_count = 5`.

---

## D-02 / D-03 Resolution: Full Current Roster (5 seats — ALL current, NO turnover)

### Confirmed Current Roster (as of 2026-06-21)

| District | Person | Title | Term | DB ext_id / pol UUID | DB office | Source |
|----------|--------|-------|------|----------------------|-----------|--------|
| District 1 | Brian Gutierrez | Councilmember | Nov 2024 – Nov 2028 | -201108 / `22fc2cdc` | `0f3cce5f` | [VERIFIED: westcovina.gov/177/Elected-Officials] |
| District 2 | Letty Lopez-Viado | **Mayor** | Nov 2022 – Nov 2026 | 687361 / `2872d7a4` | `4a8f2fd6` | [VERIFIED: westcovina.gov/172 + /177] |
| District 3 | Rosario Diaz | Councilwoman | Nov 2024 – Nov 2028 | -201107 / `f5bf4ec4` | `abd27abb` | [VERIFIED: westcovina.gov/177] |
| District 4 | Ollie Cantos | **Mayor Pro Tem** | Nov 2022 – Nov 2026 | 687365 / `ecc57cd4` | `50471af9` | [VERIFIED: westcovina.gov/172 + /177] |
| District 5 | Tony Wu | Councilman | Nov 2022 – Nov 2026 | 687367 / `1bb5c062` | `65bf4e71` | [VERIFIED: westcovina.gov/172 + /177] |

**ALL FIVE DB-seeded members are current and correctly identified. No departures (unlink-not-delete N/A this phase). No missing members (no new politician row to create). No 2024/2026 turnover that removed anyone.** This is materially simpler than El Monte (which needed a new D6 + Cortez) — West Covina is a 5-seat body and the DB already has exactly the 5 right people.

### Critical note — rotational mayor changes annually
The Mayor title rotates each year. As of **December 2024** the Mayor was **Tony Wu** and Mayor Pro Tem was Lopez-Viado [CITED: Dec 17 2024 council agenda PDF on Granicus, via WebSearch]. As of the **current official site (2026)** the Mayor is **Letty Lopez-Viado (D2)** and Mayor Pro Tem is **Ollie Cantos (D4)** [VERIFIED: westcovina.gov/172 + /177, direct WebFetch 2026-06-21]. **Use the CURRENT site assignment (Lopez-Viado Mayor, Cantos Mayor Pro Tem).** Because the title is just a label on a seat, this is a low-stakes field — but set it to the current values.

### DB State vs. Reality Gap Analysis

| DB Seeded | DB ext_id | DB Seat (current) | Real District | DB Action |
|-----------|-----------|-------------------|---------------|-----------|
| Brian Gutierrez | -201108 | At-Large LOCAL (chamber `b1a2c4cb`, one-directional) | District 1 | RELABEL district→'District 1'; repair back-pointer (`politicians.office_id`); move office to survivor chamber |
| Letty Lopez-Viado | 687361 | At-Large LOCAL (chamber `12c9360a`, clean) | District 2 | RELABEL district→'District 2'; set title='Mayor' |
| Rosario Diaz | -201107 | At-Large LOCAL (chamber `b1a2c4cb`, one-directional) | District 3 | RELABEL district→'District 3'; repair back-pointer; move office to survivor chamber |
| Ollie Cantos | 687365 | At-Large LOCAL (chamber `12c9360a`, clean) | District 4 | RELABEL district→'District 4'; set title='Mayor Pro Tem' |
| Tony Wu | 687367 | At-Large LOCAL (chamber `12c9360a`, clean) | District 5 | RELABEL district→'District 5' |

**`official_count` target: 5** (all five seats are council seats; there is no separate mayor to exclude — unlike El Monte where Mayor was excluded from the count of 6).

### DB Chamber Distribution to Reconcile

- **Survivor (recommended): `12c9360a`** (official_count 5, bidirectional-clean) — holds Lopez-Viado (D2), Cantos (D4), Wu (D5).
- **Doomed: `b1a2c4cb`** (official_count NULL, one-directional) — holds Diaz (D3), Gutierrez (D1). MOVE both offices into the survivor, repair their `politicians.office_id` back-pointers, assert doomed empty, DELETE.

> Pitfall: a naive relabel could collide if multiple offices share ONE district_id row (the "shared At-Large UUID" defect seen in Pomona/Torrance). Pre-flight MUST run the district-mapping JOIN (see Pitfall 2) to confirm each of the 5 offices points to its OWN district row before relabeling. If any offices share a district_id, split them (`gen_random_uuid()` new rows) — the Pomona 147 Lustro / Torrance 148 Sheikh "repoint off the shared district UUID" pattern.

---

## D-04 Resolution: Headshots — WAF Status Confirmed (NO WAF) + Document IDs

### WAF Status: NO WAF — all images curl-accessible at HTTP 200

`westcovina.gov` runs the **CivicEngage CMS** and serves all official council portraits via `GET /ImageRepository/Document?documentID=NNNN` at HTTP 200, no auth. The council page (`/172/Mayor-City-Council`) returns full 104 KB HTML by direct curl. [VERIFIED: curl tests in this research session — full HTML + all 5 documentIDs returned image bytes HTTP 200]. Same pattern as El Monte (151), Pasadena (149), Palmdale (146). **No operator in-browser workaround needed** (contrast Downey/Glendale/Pomona which ARE WAF-403).

> Note: use the canonical `westcovina.gov` host. `westcovina.org` 301-redirects to `westcovina.gov`; curl with `-L` follows it, but fetch the `.gov` directly to avoid redirect surprises. Note also the URL param is **`documentID`** (capital ID) on the council page; lowercase `documentId` also resolves but standardize on the form found in the page HTML.

### Image Document IDs (verified mapping from council page HTML structure, 2026-06-21)

| District | Member | documentID | URL | Verified fetch |
|----------|--------|-----------|-----|----------------|
| D1 | Brian Gutierrez | 1053 | `https://www.westcovina.gov/ImageRepository/Document?documentID=1053` | HTTP 200, JPEG 7,276 B |
| D2 | Letty Lopez-Viado (Mayor) | 1054 | `https://www.westcovina.gov/ImageRepository/Document?documentID=1054` | HTTP 200, JPEG 4,635 B |
| D3 | Rosario Diaz | 1056 | `https://www.westcovina.gov/ImageRepository/Document?documentID=1056` | HTTP 200, JPEG 5,880 B |
| D4 | Ollie Cantos (Mayor Pro Tem) | 1052 | `https://www.westcovina.gov/ImageRepository/Document?documentID=1052` | HTTP 200, JPEG 6,418 B |
| D5 | Tony Wu | 1055 | `https://www.westcovina.gov/ImageRepository/Document?documentID=1055` | HTTP 200, **PNG 147×190**, 63,821 B |

[VERIFIED: direct curl downloads + `file` type checks + HTML name↔documentID adjacency in this research session]

**Quality warning — all are LOW resolution.** The JPEGs are 4.6–7.3 KB (small thumbnails) and Tony Wu's is a 147×190 PNG. None is near 600×750. Upscaling from these will be soft. The plan should:
- Crop 4:5 then upscale to 600×750 (acceptable but soft) **OR** prefer a higher-res fallback where one exists (campaign/Ballotpedia/news).
- Ollie Cantos is a nationally-known disability advocate (RespectAbility board chair) — likely higher-res portraits exist via RespectAbility / ABA / news. [CITED: WebSearch — Cantos bio]
- These are official city portraits → `photo_license = press_use`, `photo_origin_url` = the documentID URL.

### Pre-existing image status (from CONTEXT.md DB pre-check)
All 5 currently-seeded officials already have 1 `politician_images` row each (pre-existing, dimensions **unverified**). Wave 3 task: for each, verify identity + dimensions (must be 600×750). The pre-existing rows may be the same low-res city thumbnails — re-source from the documentIDs above and upscale, or use a better fallback. Re-crop/re-source any that fail identity or dimension check; keep any that already pass.

### Fallback Sources (if official portrait is unusable / too low-res)

| Member | Fallback 1 | Fallback 2 |
|--------|-----------|-----------|
| Lopez-Viado | facebook.com/LettyLopezWestCovina (campaign) | Ballotpedia candidate page |
| Cantos | RespectAbility.org leadership page | ABA Commission on Disability Rights / news photo |
| Diaz | Ballotpedia | Facebook campaign page |
| Wu | Ballotpedia | Facebook campaign page |
| Gutierrez | Ballotpedia | Facebook campaign page |

### Processing Requirements
- Verify identity (correct person, no superimposed text/graphics).
- Crop to 4:5 ratio FIRST (never stretch), THEN resize to 600×750 via Lanczos, q90 JPEG.
- Upload to `politician_photos/{uuid}-headshot.jpg` (x-upsert), `type='default'`, `photo_license='press_use'`, `photo_origin_url`= source URL.
- Honest gap if no acceptable portrait. Blocking human-verify checkpoint.

---

## D-01 Resolution: Migration Ledger

**On-disk MAX (CONTEXT.md):** 1009 (El Monte ended at on-disk 1009).
**schema_migrations registered MAX:** 999 (live). Recent deep-seed structural migs are applied live via MCP but the on-disk/committed file counter leads.
**Next structural migration: 1010** (on-disk counter authoritative).
**Pre-flight MUST re-confirm** both the on-disk MAX (`ls C:/EV-Accounts/backend/migrations/`) and the live `schema_migrations` MAX before numbering (beware other workstreams advancing the counter overnight).

### Expected Migration File Structure (numbering subject to pre-flight)

```
C:/EV-Accounts/backend/migrations/
├── 1010_west_covina_reconcile.sql   # STRUCTURAL: geo_id backfill, chamber merge (survivor 12c9360a), relabel At-Large→D1-D5, repoint shared-district if any
├── 1011_west_covina_complete.sql    # STRUCTURAL: repair 2 one-directional links (Diaz/Gutierrez), set official_count=5, set Mayor/Mayor-Pro-Tem titles on D2/D4
├── 1012_west_covina_headshots.sql   # AUDIT-ONLY: politician_images upserts (verify-first — 5 existing)
├── 1013_lopez_viado_stances.sql     # AUDIT-ONLY (one per official)
├── 1014_cantos_stances.sql          # AUDIT-ONLY
├── 1015_diaz_stances.sql            # AUDIT-ONLY
├── 1016_wu_stances.sql              # AUDIT-ONLY
└── 1017_gutierrez_stances.sql       # AUDIT-ONLY
```

> New-politician ext_id scheme `-7010xx` is documented for completeness but **NOT needed this phase** — no new politician is created (all 5 exist). The two "negative" ext_ids in the DB (-201107 Diaz, -201108 Gutierrez) are existing rows, kept.

**COMMIT the migration files to the EV-Accounts repo** (`git -C "C:/EV-Accounts" add backend/migrations/<files>` + commit per the per-phase convention). DB is applied live via Supabase MCP; the FILES still need committing.

---

## Wave 4: Stance Evidence Scout

**Compass model:** CHAIRS (value = the discrete position chair the evidence matches, NOT a polarity axis). NO judicial topics (council-manager, appointed City Attorney). Evidence-only; 100% citation; blank spoke honest if no evidence; ALL live non-judicial topics queried at apply time (never hardcode retired IDs); one research agent at a time. All 5 = 0 stances → full greenfield.

**Council goals context (city-stated):** "protecting public safety, achieving fiscal sustainability, and addressing homeless issues." [CITED: westcovina.gov, via WebSearch] — these three are the strongest places to find documented positions.

### Evidence Summary per Member

#### Letty Lopez-Viado (D2, Mayor) — ext_id 687361
**Record depth: MEDIUM** (elected Nov 2022; ~3.5 yrs on council; current Mayor; active campaign Facebook presence).
- Mayor's annual priorities / State-of-the-City likely document public-safety, homelessness, fiscal positions. [ASSUMED — research agent should mine council agendas + Mayor remarks]
- Campaign Facebook (facebook.com/LettyLopezWestCovina) may carry stated positions. [CITED: WebSearch result]

#### Ollie Cantos (D4, Mayor Pro Tem) — ext_id 687365
**Record depth: MEDIUM-HIGH** (elected Nov 2022; ~3.5 yrs; nationally-prominent disability-rights advocate — RespectAbility board chair, ABA Commission on Disability Rights mentor; "first blind person and individual with a visible disability ever elected to the Council").
- Disability/accessibility positions richly documented (national profile). [CITED: WebSearch — Cantos bio]
- Council votes on public safety, homelessness, fiscal over 3.5 yrs. [ASSUMED — agent mines agendas + news]

#### Rosario Diaz (D3, Councilwoman) — ext_id -201107
**Record depth: LOW-MEDIUM** (elected Nov 2024; ~19 months tenure). Pre-2024 record only if prior office. Expect thinner record; some honest blanks likely. Agent should check 2024 candidate statements/questionnaires + 19 months of votes.

#### Tony Wu (D5, Councilman) — ext_id 687367
**Record depth: MEDIUM** (elected Nov 2018, re-elected Nov 2022; longest-tenured of the five — 7+ yrs; served as Mayor Dec 2024 rotation). Richest voting record. Agent should mine the multi-year agenda archive + local news (SGV Tribune, San Gabriel Valley Examiner).

#### Brian Gutierrez (D1, Councilmember) — ext_id -201108
**Record depth: LOW-MEDIUM** (elected Nov 2024; ~19 months tenure). Thinner record; some honest blanks likely. Check 2024 candidate materials + 19 months of votes.

### Topics Applicable to West Covina Council

Council-manager city → NO judicial topics.

| Topic | Likely applicable | Notes |
|-------|------------------|-------|
| public-safety-approach | Yes | City names public safety a top goal; police/fire funding debates |
| homelessness / homelessness-response | Yes | City names homelessness a top goal; SGV regional issue |
| housing | Yes | SCAG RHNA obligations; housing element |
| economic-development | Yes | Fiscal sustainability is a stated council goal; West Covina mall/retail redevelopment |
| local-immigration | Possibly | Heavily Latino + Asian community |
| rent-regulation | Verify per evidence | NO known active West Covina RSO — do NOT manufacture; blank unless a real vote/statement exists (Torrance 148 discipline) |
| transportation | Possibly | SGV transit, freeway-adjacent |
| residential-zoning | Possibly | Density/upzoning under housing element |

> Discipline (Torrance/Downey lesson): only apply rent-regulation if a real West Covina vote or stated position exists. Do NOT default it. Pre-tenure attribution: do NOT attribute a council vote to a member who was not seated at the time (Diaz/Gutierrez seated Nov 2024).

---

## Architecture Patterns

### System Architecture Diagram

```
westcovina.gov (CivicEngage CMS — NO WAF — HTTP 200 direct curl)
        |
        v
[Operator: curl documentID URLs (1052-1056) → verify identity → 4:5 crop → 600×750 upscale]
        |
        v
[Supabase Storage: politician_photos/{uuid}-headshot.jpg]
        |
[inform.politician_answers + politician_context: stance INSERT per member]
        |
[essentials schema writes (structural migrations 1010/1011: geo_id, chamber merge, relabel, link repair)]
        |
        v
[Browse + compass UI — West Covina appears via geo_id 0684200 once backfilled + single chamber]
```

### Recommended Project Structure
Follows established 4-wave pattern (see Migration File Structure above).

### Pattern 1: By-District Relabel (Palmdale/Pomona/El Monte Model)
**What:** Relabel existing 'At-Large' district rows to numbered districts; split any shared district_id.
**Example:**
```sql
UPDATE essentials.districts
SET label = 'District 1', district_type = 'LOCAL'
WHERE id = '<gutierrez_district_uuid>'
  AND label = 'At-Large';   -- idempotency guard
```
[VERIFIED: Phases 146 Palmdale, 147 Pomona, 149 Pasadena, 151 El Monte — standard by-district relabel]

### Pattern 2: Move-Then-Delete Chamber Merge
**What:** Move offices from doomed chamber into survivor, assert doomed empty, delete it.
```sql
UPDATE essentials.offices SET chamber_id = '12c9360a-60ac-476f-b2ac-055a26e891a0'  -- survivor
WHERE chamber_id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45';                          -- doomed

DO $$ BEGIN
  IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45') > 0
  THEN RAISE EXCEPTION 'Doomed chamber not empty — STOP'; END IF;
END $$;

DELETE FROM essentials.chambers WHERE id = 'b1a2c4cb-25b6-46c8-a3ab-852024e00f45';
```
[VERIFIED: Phases 146, 147, 149, 150, 151 — standard move-then-delete]

### Pattern 3: Rotational Mayor = Title on a Seat (Palmdale/Glendale Model)
**What:** No separate Mayor office. The Mayor (and Mayor Pro Tem) is a `title` on a sitting district councilmember's office row. NO LOCAL_EXEC district.
**Implementation:** Set `offices.title='Mayor'` on Lopez-Viado's D2 office and `title='Mayor Pro Tem'` on Cantos's D4 office. All 5 district_type stay `LOCAL`. NO LOCAL_EXEC row is created.
[VERIFIED: Phase 146 Palmdale (rotational mayor as title), 144 Glendale — contrast El Monte 151 / Lancaster 145 which have a directly-elected LOCAL_EXEC mayor]

### Anti-Patterns to Avoid
- **Creating a LOCAL_EXEC Mayor office:** West Covina's mayor is rotational. There is NO separately-elected mayor. The DB's absence of a Mayor office is CORRECT — do NOT add one. (This is the OPPOSITE of El Monte.)
- **Setting Mayor title to Tony Wu:** Wu was Mayor in the Dec 2024 rotation; the CURRENT mayor (2026) is Lopez-Viado. Use the current site assignment.
- **Relabeling a shared district_id incorrectly:** if two offices share one At-Large district row, relabeling that one row changes both seats' label. Run the pre-flight JOIN; split shared rows first.
- **Creating a new politician:** all 5 members already exist. NO new politician row this phase (contrast El Monte's Cortez).
- **Hardcoding compass topic IDs:** always query live topics at apply time.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber deduplication | Custom merge logic | Proven move-then-delete SQL from mig 1000/946/919 | Edge cases: bidirectional pointers, FK constraints |
| Image cropping/upscale | PIL one-liner | Established Pillow pipeline (4:5 crop → 600×750 Lanczos q90) | Aspect-ratio enforcement, quality |
| Stance insertion | Raw INSERT w/o conflict handling | `ON CONFLICT (politician_id, topic_id) DO UPDATE` | Idempotency on re-run |
| Shared-district split | Hardcoded UUIDs | `gen_random_uuid()` + guard | Collision prevention |

---

## Runtime State Inventory

This is a reconcile/relabel phase, not a rename/refactor. No string-level renames, no stored-data key changes, no OS-registered state, no secrets/env changes, no build artifacts.

**N/A — verified: no runtime state outside the DB changes in this phase.** (geo_id backfill + chamber merge + district relabels + headshot uploads + stance inserts are all DB/Storage writes; nothing cached or registered elsewhere references a renamed string.)

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| At-large 5-seat West Covina council (pre-2017) | 5 by-district seats (D1–D5) + rotational mayor | Ord. 2310 (Jan 2017) + Sanchez CVRA settlement (Feb 2017); Public Plan Map 120; first district elections Nov 2018 (D2/4/5), Nov 2020 (D1/3) |
| DB 'At-Large' labels (stale partial seed) | District 1–5 labels (post-relabel) | This phase relabels them |

**Deprecated/outdated:**
- Training data calling West Covina council "at-large" — OUTDATED since 2017/2018; do not rely on.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The 5 existing At-Large office rows each point to their OWN district_id row (no shared district UUID) | Roster / Wave 1 | If shared (Pomona/Torrance defect), relabel would mislabel multiple seats — pre-flight JOIN (Pitfall 2) MUST confirm before relabel; split shared rows |
| A2 | All 5 city-site headshot documentIDs (1052–1056) are individual portraits of the correct person (not group/text-overlay) | Headshots | Verify each by viewing before processing; use fallback if a photo fails identity check |
| A3 | No West Covina council member departed/resigned since the official site was last updated | Roster | Site shows all 5 current as of fetch 2026-06-21; risk low; pre-flight re-confirm at execution |
| A4 | On-disk migration counter = 1009 (no other workstream advanced it overnight) | Migration | Pre-flight `ls` on execution day; renumber if advanced |
| A5 | West Covina has NO active rent-stabilization ordinance | Stances | If an RSO exists, rent-regulation stances would apply — agent must verify before blanking; do NOT manufacture either way |
| A6 | Current rotational Mayor = Lopez-Viado, Mayor Pro Tem = Cantos (per 2026 site) | Roster titles | Title rotates annually; low stakes (label on seat); re-confirm current assignment at execution |

---

## Open Questions

1. **Do all 5 offices point to distinct district rows, or is there a shared At-Large district UUID?**
   - What we know: 5 offices across 2 chambers, all labeled 'At-Large'.
   - What's unclear: whether they share district_id rows (Pomona/Torrance defect) or each has its own.
   - Recommendation: Pre-flight JOIN (Pitfall 2 query) as the FIRST step of Plan 01; split shared rows with `gen_random_uuid()` before relabeling.

2. **Are the 5 pre-existing `politician_images` rows the same low-res city thumbnails, or better photos?**
   - What we know: city-site portraits are 4.6–7.3 KB JPEGs + one 147×190 PNG (all sub-600×750).
   - What's unclear: dimensions/quality of the existing DB rows.
   - Recommendation: Wave 3 verify each existing image's dimensions; if <600×750 or wrong person, re-source (documentID upscale or higher-res fallback, esp. Cantos via RespectAbility).

3. **Is there a higher-resolution Ollie Cantos portrait?**
   - What we know: nationally-prominent advocate (RespectAbility chair) — likely high-res photos exist.
   - Recommendation: agent/operator check RespectAbility.org leadership page + ABA + news before settling for the low-res city thumbnail.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| curl | Headshot download | Yes | system | — (NO WAF confirmed) |
| Pillow (Python) | Headshot 4:5 → 600×750 | Yes (established pipeline) | system | — |
| Supabase MCP (`mcp__supabase-local`) | All DB writes | Yes | — | — |
| westcovina.gov direct curl | Headshot + roster source | YES (HTTP 200 confirmed, NO WAF) | — | Campaign/Ballotpedia/RespectAbility fallbacks |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None — all requirements met.

---

## Validation Architecture

Per project convention, structural migrations are verified immediately post-apply via inline SQL assertions (STOP-on-drift in each migration). Stance + headshot migrations are audit-only, verified by count queries after apply.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Inline SQL assertions in migrations + post-apply count queries (no JS/py test runner for data phases) |
| Config file | none — DB-assertion pattern established Phases 145–151 |
| Quick run | per-migration `DO $$ … RAISE EXCEPTION …$$` guards |
| Full suite | post-apply verification SELECTs (see map below) + split-section check |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | How to Verify |
|--------|----------|-----------|---------------|
| WCOV-01a | `governments.geo_id = '0684200'` | SQL assertion | `SELECT geo_id FROM essentials.governments WHERE id='1982a9fa-dc56-482d-83fc-27bf69458b22'` = '0684200' |
| WCOV-01b | Single 'City Council' chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='1982a9fa-…' AND name='City Council'` = 1 |
| WCOV-01c | 5 offices in survivor chamber | SQL assertion | `SELECT COUNT(*) FROM essentials.offices WHERE chamber_id='12c9360a-…'` = 5 |
| WCOV-01d | official_count = 5 | SQL assertion | `SELECT official_count FROM essentials.chambers WHERE id='12c9360a-…'` = 5 |
| WCOV-01e | All 5 bidirectional links | SQL assertion | every office's `politician_id` ↔ that politician's `office_id` matches (5/5) |
| WCOV-01f | Roster matches D1 Gutierrez / D2 Lopez-Viado / D3 Diaz / D4 Cantos / D5 Wu | SQL assertion | ext_ids {-201108, 687361, -201107, 687365, 687367} all present in survivor |
| WCOV-01g | District labels = 'District 1'..'District 5' (no 'At-Large', no LOCAL_EXEC) | SQL assertion | `SELECT DISTINCT d.label, d.district_type FROM districts d JOIN offices o ON o.district_id=d.id WHERE o.chamber_id='12c9360a-…'` = {District 1..5, all LOCAL} |
| WCOV-01h | Mayor/Mayor Pro Tem titles set on D2/D4 | SQL check | `offices.title` = 'Mayor' (Lopez-Viado), 'Mayor Pro Tem' (Cantos) |
| WCOV-01i | Headshots present for all 5 (or documented gaps) | SQL count | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (…5…)` = 5 |
| WCOV-01j | Stances 100% cited, no defaults | SQL + manual | all `inform.politician_answers` rows have paired `politician_context` with source URLs |
| WCOV-01k | Split-section check = 0 rows | SQL assertion | `feedback_section_split_check` query returns 0 for geo_id 0684200 |

### Sampling Rate
- Per migration: inline assertion guards must pass before commit.
- Per wave: post-apply verification SELECTs.
- Phase gate: all assertions green + split-section 0 rows before `/gsd:verify-work`.

### Wave 0 Gaps
None — test infrastructure (SQL-assertion pattern) established Phases 145–151. No new framework needed.

---

## Security Domain

No new authentication, API endpoints, or data-handling patterns. Pure DB reconcile + static media upload to existing Storage bucket. Supabase MCP writes go to the production DB (treat as live). Security domain: not applicable beyond existing project controls.

---

## Sources

### Primary (HIGH confidence)
- `westcovina.gov/172/Mayor-City-Council` — official council listing (5 members, districts, Mayor/Mayor-Pro-Tem, rotational-mayor statement, council-manager form) — direct WebFetch + curl
- `westcovina.gov/177/Elected-Officials` — per-district members + terms (D1 Gutierrez, D2 Lopez-Viado Mayor, D3 Diaz, D4 Cantos Mayor Pro Tem, D5 Wu) + City Clerk/Treasurer — direct WebFetch
- `westcovina.gov` council-districts background page — CVRA transition (Ord. 2310, Sanchez settlement, Map 120, Nov 2018/2020 sequencing) — via WebSearch result text
- `westcovina.gov/ImageRepository/Document?documentID={1052-1056}` — 5 council portraits, all HTTP 200, mapped to members via council-page HTML — direct curl + `file` type checks
- Council-page HTML name↔documentID adjacency — direct curl + grep in this session

### Secondary (MEDIUM confidence)
- `leginfo.legislature.ca.gov` AB-1979 — "City of West Covina: city council district-based local elections" (state enabling legislation)
- Granicus Dec 17 2024 council agenda PDF — Tony Wu as Mayor in Dec 2024 rotation (corroborates rotational mayor)
- WebSearch result text — council goals (public safety, fiscal sustainability, homelessness); Cantos bio (RespectAbility, ABA, first blind councilmember)
- `facebook.com/LettyLopezWestCovina` — Lopez-Viado campaign page (stance fallback)

### Tertiary (LOW confidence)
- Training data characterizing West Covina council as "at-large" — OUTDATED since 2017/2018; do not rely on.

---

## Metadata

**Confidence breakdown:**
- Form of government (5 by-district + rotational mayor, no separate mayor office): HIGH — official site + CVRA ordinance + AB-1979 all consistent
- Current roster (all 5 + districts + titles): HIGH — direct WebFetch of two official city pages, fully consistent
- Stale/missing member identification: HIGH — no stale, no missing, no new member (cleanest of the deep-seeds); all 5 DB members current
- Headshot sources (NO WAF): HIGH — direct curl tests confirmed HTTP 200 + image bytes for all 5 documentIDs; image-quality LOW (sub-600×750, needs upscale/fallback)
- Stance evidence: LOW-MEDIUM — requires research agent per person; Wu (7+ yr) + Cantos (national profile) richer; Diaz + Gutierrez (Nov 2024) thinner; honest blanks expected

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (30 days; next West Covina district elections Nov 2026 for D2/D4/D5; rotational mayor re-selected ~annually — re-confirm mayor title at execution)
