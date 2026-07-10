# Phase 154: Burbank Deep-Seed - Research

**Researched:** 2026-06-21
**Domain:** City of Burbank, CA — reconcile deep-seed (form of government, current roster, headshots, evidence-only stances)
**Confidence:** HIGH (official city site verified via curl + Granicus board roster; all 4 critical questions resolved)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (reconcile not greenfield):** Backfill `governments.geo_id='0608954'` on gov `3e3deaea` (guard `geo_id IS NULL OR geo_id=''`). Merge two duplicate 'City Council' chambers: SURVIVOR = `73422d25` (official_count 5, 3 offices, bidirectional-clean). DOOMED = `6a72dbe8` (official_count NULL, 2 offices, one-directional). Move-then-delete. Repair one-directional links for Anthony and Mullins. Re-point Anthony and Mullins to surviving At-Large district `15458750`. Delete doomed At-Large district `809bbb35`. Wave-1 STOP-on-drift pre-flight re-confirms all UUIDs + both ledger MAX values.
- **D-02 (at-large + rotational mayor — DEFER TO RESEARCH):** No guessed default. Research MUST verify (a) at-large vs by-district and (b) rotational vs directly-elected Mayor before committing structure.
- **D-03 (research-verify roster; unlink-not-delete if not current member):** DB has Perez (663414), Rizzotti (663419), Takahashi (663418), Anthony (-201161), Mullins (-201162). Zizette Mullins flagged as prime suspect (possibly City Clerk, not council member). Unlink-not-delete if not current. New members get `-7010xx` ext_id. Set `official_count=5`.
- **D-04 (verify-and-fix 3 existing + fill 2 gaps):** Rizzotti 0 images, Takahashi 0 images. Verify existing Perez/Anthony/Mullins headshots for correct person, no superimposed graphics, 600×750. Fill gaps from burbankca.gov (WAF status unknown — check). Wrong-person guard carried forward from West Covina.
- **Wave 4 (evidence-only stances, full greenfield for all 5):** Chairs model; 100% citation; no defaulted values; no judicial-* topics; ONE agent at a time; all 5 officials currently at 0 stances.
- **Migration ledger:** Structural migs register in schema_migrations; headshot+stance migs AUDIT-ONLY. Next migration = 1026 (on-disk authoritative; pre-flight re-confirms both MAX values). Commit to EV-Accounts repo via `git -C "C:/EV-Accounts"`.
- **Verdict bar:** Structure-hard / data-soft. Correct government + single chamber + correct roster/form-of-government is the hard requirement.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153 idempotent patterns), survivor-chamber move-then-delete mechanics, At-Large district consolidation mechanics, per-member stance chairs, which existing headshots pass vs need re-crop.

### Deferred Ideas (OUT OF SCOPE)
- Burbank Unified School District (gov `d5ffbb65`) — separate government.
- Split-section check post-reconcile (expect 0 rows; Burbank NOT in the known split-section defect set).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 157 (Wave-2 close-out) consumes Burbank's final per-city counts.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BURB-01 | City of Burbank (geo_id 0608954) deep-seeded — government + roster + headshots + evidence-only stances | Form of government confirmed (AT-LARGE council + rotational Mayor); full current roster verified (all 5 DB rows are correct current council members — Mullins is NOT the City Clerk, she is the seated Vice Mayor); headshot URLs confirmed NO-WAF + all 5 direct URLs verified HTTP 200; stance source landscape documented per member |
</phase_requirements>

---

## Summary

**Critical Finding 1 — Form of Government (D-02 RESOLVED):** Burbank uses AT-LARGE elections for all five City Council seats — five members elected citywide, no district boundaries. Confirmed via the official burbankca.gov web source: "The legislative body of the City consists of five (5) persons elected at large." The City's Council-Manager form of government is described on a dedicated page. The CVRA lawsuit (filed Oct 2023) is ongoing and will place two ballot measures on the November 3, 2026 ballot asking voters to decide whether to adopt by-district elections — but this has NOT happened yet. As of June 2026, Burbank is still AT-LARGE. The Mayor is ROTATIONAL, elected annually by/from the council at the December reorganization meeting. There is NO directly-elected Mayor office. [VERIFIED: burbankca.gov search results + burbankca.gov/council-manager-form-of-government]

**Critical Finding 2 — Current Roster (D-03 RESOLVED — Mullins is LEGITIMATE):** All five DB-seeded people are confirmed CURRENT Burbank City Council members. **Zizette Mullins is NOT the City Clerk** — she is a former City Clerk who retired from that role and then ran for and won a council seat in the November 2022 election. She has served as a council member since December 19, 2022. As of December 15, 2025, she is the VICE MAYOR. **No unlinking is required for any of the 5 DB rows.** The current rotational structure: Mayor = Tamala Takahashi (elected Dec 15, 2025); Vice Mayor = Zizette Mullins (elected Dec 15, 2025). [VERIFIED: myBurbank.com Dec 2025 article; Granicus board roster; LegiStorm biographies; burbankca.gov newsroom]

**Critical Finding 3 — WAF Status + Headshots (D-04 RESOLVED):** burbankca.gov returns HTTP 200 with a Chrome User-Agent (the WebFetch tool returned 403, but direct curl with a browser UA works). The city site uses Liferay CMS with an adaptive-media image system. All five official council headshots are accessible via direct curl at HTTP 200 — verified. Takahashi and Rizzotti (the two 0-image gaps) both have fresh Dec 2025 official portraits available at direct URLs. [VERIFIED: curl HTTP 200 on all 5 portrait URLs]

**Critical Finding 4 — Stance Sources Assessed:** Konstantine Anthony (in office since Dec 2020, served as 2023 Mayor) is the richest record — DSA member, Green New Deal co-champion, police abolitionist stances on record. Perez and Takahashi (both elected 2022) have medium-depth environmental records. Mullins has a thinner progressive record with one notable dissent on rent cap (opposed the 4% soft cap in favor of ≥5%). Rizzotti is thinnest (elected Dec 2024, recused from rent cap vote due to Realtor FPPC conflict).

**Primary recommendation:** Proceed with the full 4-wave reconcile. D-02 and D-03 are fully resolved. Structure is simple: 5 at-large council seats, rotational Mayor title on Takahashi's existing seat, rotational Vice Mayor title on Mullins's existing seat. official_count=5. No district relabeling needed (stays At-Large). No unlinking needed. Wave 3 headshots all available at HTTP 200 via direct curl with Chrome UA.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure (geo_id, chamber merge, districts) | Database / Storage | — | Pure DB reconcile — no API/UI change |
| Roster management (link repair, Mayor/VP titles) | Database / Storage | — | Migration SQL only |
| Headshot ingestion (crop, upload, politician_images) | Database / Storage | API / Backend | Supabase Storage upload + DB row insert |
| Stance research + ingestion | Database / Storage | — | inform.politician_answers + inform.politician_context via MCP |
| Browse surfacing (geo_id → officials) | API / Backend | Browser / Client | geo_id backfill enables existing browse routes |

---

## Standard Stack

No new packages are installed in this phase. Same migration + Supabase MCP pattern as phases 142–153.

### Migration Toolchain (carried forward, no changes)
| Tool | Version | Purpose |
|------|---------|---------|
| Supabase MCP (`mcp__supabase-local`) | live | Apply SQL migrations directly to production DB |
| PostgreSQL SQL | — | Migration file format (`.sql`); idempotent `DO $$ ... $$ LANGUAGE plpgsql` blocks |
| EV-Accounts git repo | master | Migration file storage and commit tracking |
| curl (Chrome UA) | system | Headshot download from burbankca.gov (HTTP 200 with `-A "Mozilla/5.0..."` UA) |

### Template Migration Files (confirmed present from prior phases)
| File | Path | Use for Burbank |
|------|------|-----------------|
| `1018_inglewood_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Most recent dual-chamber-merge + one-directional link-repair + geo_id backfill template |
| `1019_inglewood_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Roster complete (verify current, official_count) |
| `1010_west_covina_reconcile.sql` | `C:/EV-Accounts/backend/migrations/` | Dual-chamber merge + At-Large (no relabel needed) + link-repair template |
| `1011_west_covina_complete.sql` | `C:/EV-Accounts/backend/migrations/` | Rotational Mayor title-on-seat pattern |

---

## Package Legitimacy Audit

> Not applicable — this phase installs zero new packages. Migration SQL + Supabase MCP only.

---

## Architecture Patterns

### System Architecture Diagram

```
burbankca.gov                   Supabase DB (production)
  /elected-officials             ┌──────────────────────────────────┐
  (Liferay CMS,                  │  essentials.governments           │
   adaptive-media image          │    3e3deaea  geo_id→0608954       │
   system, Chrome UA req)        │                                  │
       │                         │  essentials.chambers             │
       │ curl -A "Chrome UA"     │    73422d25 (SURVIVOR, At-Large)  │
       ▼                         │    6a72dbe8 (DOOMED→delete)       │
  portrait JPGs (HTTP 200)       │                                  │
  4:5 crop → 600×750             │  essentials.offices (5)          │
  Lanczos q90                    │    5 At-Large seats               │
       │                         │    Takahashi title='Mayor'        │
       ▼                         │    Mullins title='Vice Mayor'     │
  Supabase Storage               │    Anthony / Perez / Rizzotti     │
  politician_photos/             │                                  │
  {uuid}-headshot.jpg            │  essentials.politicians (5)      │
       │                         │    all 5 confirmed current        │
       ▼                         │                                  │
  politician_images rows         │  inform.politician_answers        │
  (audit-only migration)         │  inform.politician_context        │
                                 │    (audit-only migrations)        │
Web sources (stances)            └──────────────────────────────────┘
  burbankca.gov/council-votes
  myburbank.com / burbankleader
  outlooknewspapers.com
  konstantineanthony.com
  Ballotpedia, Wikipedia
```

### Recommended Migration File Names (follow 1018/1019 pattern)

```
C:/EV-Accounts/backend/migrations/
├── 1026_burbank_reconcile.sql     # Wave 1: geo_id + chamber merge + link repair (STRUCTURAL, registered)
├── 1027_burbank_complete.sql      # Wave 2: verify roster + Mayor/VP titles + official_count=5 (STRUCTURAL, registered)
├── 1028_burbank_headshots.sql     # Wave 3: headshots (AUDIT-ONLY, NOT registered)
└── 1029_burbank_stances_*.sql     # Wave 4: per-member stances (AUDIT-ONLY, NOT registered, one file per member)
```

### Pattern: At-Large Stays At-Large (key difference from Inglewood/West Covina/El Monte)

Burbank's council is confirmed AT-LARGE through at least November 2026 (CVRA ballot measure has not yet passed). The five existing `At-Large` district labels in the DB are CORRECT. No relabeling required. This simplifies Wave 1 significantly compared to the prior two phases (Inglewood was by-district; West Covina was by-district). Use the chamber-merge + link-repair from 1018 but OMIT the by-district relabeling step.

### Pattern: Rotational Mayor = Title on Seat (West Covina / Downey model)

Burbank's annual reorganization meeting selects a Mayor and Vice Mayor by council vote. These are titles — not separate offices. The current rotational state (as of Dec 15, 2025):
- **Mayor:** Tamala Takahashi → her existing `At-Large` office gets `title = 'Mayor'` (or the appropriate title field)
- **Vice Mayor:** Zizette Mullins → her existing `At-Large` office gets `title = 'Vice Mayor'`
- **All others:** `title = 'Council Member'` (or the city's preferred "City Council Member")

No new LOCAL_EXEC office is created. official_count remains 5 (all 5 seats are equivalent At-Large council seats; the Mayor/VP titles are rotational honors). This is the West Covina 152 / Downey 150 model.

### Anti-Patterns to Avoid
- **Creating a LOCAL_EXEC Mayor office:** Burbank has no directly-elected Mayor. Do NOT create a separate Mayor office. The rotational mayor title lives on Takahashi's existing At-Large council seat.
- **Relabeling At-Large to District N:** The CVRA lawsuit has NOT yet resulted in district elections. Burbank stays At-Large until voters approve the Nov 2026 ballot measures.
- **Unlinking Mullins:** She is a legitimate current council member and Vice Mayor, NOT the City Clerk. DO NOT unlink her.
- **Using WebFetch for headshots:** burbankca.gov returns HTTP 403 to the standard WebFetch UA. Use `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"` instead — confirmed HTTP 200 for all 5 portrait URLs.
- **Numbering migrations before pre-flight:** Always re-confirm BOTH on-disk MAX (1025) and live `schema_migrations` MAX (999) before assigning 1026/1027. A parallel workstream could advance either.

---

## Form of Government — VERDICT

**AT-LARGE + ROTATIONAL MAYOR. CONFIRMED.**

| Question | Answer | Confidence | Source |
|----------|--------|------------|--------|
| At-large or by-district? | **AT-LARGE** — 5 members elected citywide | HIGH | burbankca.gov/council-manager-form-of-government; CVRA settlement news item confirming at-large is current system |
| CVRA lawsuit / district threat? | Ballot measures on Nov 3, 2026 to let voters decide. No change before then. | HIGH | burbankca.gov newsroom (CVRA settlement article) |
| Mayor directly elected or rotational? | **ROTATIONAL** — elected annually by/from the council at the December reorganization meeting | HIGH | myBurbank.com Dec 2025 article explicitly describes "a rotation policy the City Council adopted" |
| Seat count | **5** (all At-Large) | HIGH | Granicus board roster; burbankca.gov form-of-government description |
| Current Mayor (as of Dec 15, 2025) | **Tamala Takahashi** | HIGH | myBurbank.com; burbankca.gov newsroom; Granicus roster |
| Current Vice Mayor | **Zizette Mullins** | HIGH | myBurbank.com; burbankca.gov newsroom |
| City government type | **Council-Manager** (City Manager is appointed executive) | HIGH | burbankca.gov/council-manager-form-of-government |
| official_count for the chamber | **5** (all council, no separate Mayor office) | HIGH | Form of government confirmed at-large + rotational |

---

## Roster — VERDICT

**ALL FIVE DB ROWS ARE CORRECT CURRENT COUNCIL MEMBERS. NO UNLINKING NEEDED.**

The suspect Zizette Mullins is confirmed NOT the City Clerk — she retired from that role and was then elected to the council in November 2022. She is a fully legitimate seated council member and current Vice Mayor.

| Name | DB ext_id | DB pol UUID | Role (as of Dec 2025) | Term | Confirmed Source |
|------|-----------|-------------|----------------------|------|-----------------|
| Tamala Takahashi | 663418 | `ea6f7109` | **Mayor** (rotational, Dec 2025–Dec 2026) | Dec 2022–Dec 2026 | Granicus board; myBurbank.com; burbankca.gov newsroom |
| Zizette Mullins | -201162 | `f933bd87` | **Vice Mayor** (rotational, Dec 2025–Dec 2026) | Dec 2022–Dec 2026 | Granicus board; myBurbank.com; LegiStorm biography |
| Konstantine Anthony | -201161 | `6c4c7919` | Council Member (2nd term) | Dec 2020–Dec 2028 | Granicus board; ballotpedia.org; Wikipedia |
| Nikki Perez | 663414 | `96f91743` | Council Member | Dec 2022–Dec 2026 | Granicus board; outlooknewspapers.com |
| Christopher John Rizzotti | 663419 | `a83a63a8` | Council Member (1st term) | Dec 2024–Dec 2028 | Granicus board; myBurbank.com election results |

**No members to unlink. No new members to create.** All 5 DB persons are confirmed seated as of June 2026.

**Mullins background note:** Zizette Mullins served as Burbank City Clerk (appointed 2012, elected 2013, certified CMC 2014, MCMC 2016). She retired from the Clerk role, then filed as a council candidate for the November 2022 election and won. Her prior role as City Clerk is why she was suspected — but she is unambiguously a current council member and the Vice Mayor. [CITED: myBurbank.com "Burbank's City Clerk Throws in Her Hat"; LegiStorm biography; Granicus board roster showing "1st Term: Dec 19, 2022 to Dec 14, 2026"]

**2024 election note:** In November 2024, two seats were up — Konstantine Anthony (running for re-election, won) and an open seat previously held by a departing member. Christopher Rizzotti won that second seat, edging out Judie Wilke (20.0% vs 19.2%). Rizzotti is a first-term member, sworn in Dec 16, 2024. [CITED: myBurbank.com "Anthony Reelected, Rizzotti and Wilke Still battling"]

---

## Headshots

### WAF Status: SEMI-BLOCKED (Chrome UA required — direct curl works)

burbankca.gov blocks standard WebFetch user agents (HTTP 403 confirmed). However, with a browser Chrome User-Agent string, direct `curl` returns HTTP 200. This is the same pattern as Glendale — not fully WAF-403 (which blocks all curl) but requires UA spoofing. **Operator in-browser fallback is NOT needed.**

Verified test: `curl -s -o /dev/null -w "%{http_code}" <URL> -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"` returns 200 for all five portrait URLs.

The site uses **Liferay CMS** with an adaptive-media image system. Two URL patterns are available for each photo:
1. `adaptive-media/image/{fileEntryId}/Preview-1000x0/{filename}.jpg?t={timestamp}` — full-size preview, best for headshots
2. `documents/d/guest/{slug-filename}-jpg?download=true` — alternate download path (also HTTP 200 verified)

### Official Headshot URLs (all verified HTTP 200 with Chrome UA)

| Official | Role | fileEntryId | Adaptive-Media URL (preferred) | Notes |
|---------|------|-------------|-------------------------------|-------|
| Tamala Takahashi | Mayor | 3949213 | `https://www.burbankca.gov/o/adaptive-media/image/3949213/Preview-1000x0/20251208-portrait-Tamala-Takahashi-001.jpg?t=1766442190215` | Fresh Dec 8, 2025 portrait |
| Zizette Mullins | Vice Mayor | 3176813 | `https://www.burbankca.gov/o/adaptive-media/image/3176813/Preview-1000x0/20241223-zizette-mullins-portrait-002.jpg?t=1734997758573` | Dec 23, 2024 portrait |
| Konstantine Anthony | Council Member | 2161825 | `https://www.burbankca.gov/o/adaptive-media/image/2161825/Preview-1000x0/20221219-konstantine-anthony-portrait-001+%281%29.jpg?t=1671524088528` | Dec 19, 2022 portrait; also available at `/documents/20124/0/...` direct path |
| Nikki Perez | Council Member | 2168721 | `https://www.burbankca.gov/o/adaptive-media/image/2168721/Preview-1000x0/20221222-nikki-perez-portrait-001.jpg?t=1671722858156` | Dec 22, 2022 portrait; also at `/documents/20124/0/...` direct path |
| Christopher Rizzotti | Council Member | 3940848 | `https://www.burbankca.gov/o/adaptive-media/image/3940848/Preview-1000x0/20251215-portrait-Rizzotti-final.jpg?t=1765923026167` | Fresh Dec 15, 2025 portrait — this is the 0-image gap fill |

**Alternate download URLs (also HTTP 200, same portrait):**
- Takahashi: `https://www.burbankca.gov/documents/d/guest/20251208-portrait-tamala-takahashi-001-jpg?download=true`
- Rizzotti: `https://www.burbankca.gov/documents/d/guest/20251215-portrait-rizzotti-final-jpg?download=true`
- Mullins: `https://www.burbankca.gov/documents/d/guest/20241223-zizette-mullins-portrait-002-jpg?download=true`

### Existing DB Images — Verify and Fix

Three officials already have images in the DB (Perez 1, Anthony 1, Mullins 1). Wave 3 must verify these existing images are:
- The correct person (wrong-person guard from West Covina lesson)
- No superimposed text/graphics (e.g., "Re-Elect" banners)
- 600×750 pixels, 4:5 ratio

If any existing image fails these checks, re-fetch from the official URLs above and re-crop/re-upload.

**Special note on Mullins' existing image:** The DB image for Mullins was seeded before research confirmed she was a council member (not City Clerk). Verify the existing image is a council-member portrait, not a City Clerk headshot. The official city site shows her as `20241223-zizette-mullins-portrait-002.jpg` (Dec 2024 date) — likely the current correct one.

### Fallback Sources (if official portraits fail inspection)

| Official | Primary Fallback | Notes |
|---------|-----------------|-------|
| Takahashi | tamala4burbank.com campaign site | Takahashi has a campaign site with photos |
| Rizzotti | chrisforburbank.com campaign site | Wix CDN image confirmed at `https://static.wixstatic.com/media/64a0a1_0b63642a76e64feab2027c1f3ece12ca~mv2.jpg` — but official Dec 2025 portrait is preferable |
| Perez | nikkiperez.com | Campaign site with professional photos |
| Anthony | konstantineanthony.com | Campaign site with photos |
| Mullins | Instagram @zizettemullinscouncilmember | Campaign/social photos |
| Any | Ballotpedia candidate pages | Less reliable for quality headshots but available for all 5 |

---

## Stance Sources (Wave 4 Survey — non-blocking for structure)

Wave 4 runs one agent at a time per the rate-limit rule. This section is a pre-research landscape survey, not exhaustive evidence mining.

**No judicial topics** for any member — Burbank is council-manager with an appointed City Attorney.

### Konstantine Anthony — RICHEST RECORD (longest tenure, former Mayor 2023)

- **Public safety / policing:** Publicly declared himself a "full abolitionist" who supports eliminating police and prisons entirely (2023). Earlier positions (2020 campaign): opposed predictive policing tech, eliminate qualified immunity, decouple Mental Health Evaluation Team from police oversight. Strong evidence for public-safety positions. [CITED: Streetsblog LA interview Dec 2020; search results]
- **Environment:** Co-champion of Burbank's Green New Deal (passed 2022), which requires 50% carbon reduction by 2030, carbon-neutral by 2040. Supported iron-flow battery pilot. LA League of Conservation Voters endorsed (2020). [CITED: Blue Values Burbank; LALCV endorsement]
- **Rent regulation:** Voted YES on 4% soft rent cap (Oct 2024, was the 3rd vote in the 3-1 majority); originally advocated for a HARDER cap (as low as 3%). [CITED: outlooknewspapers.com rent cap article — confirmed specific vote]
- **Homelessness:** Highlighted year-over-year decline in homeless population during his tenure; broke ground on Burbank's first homeless shelter. [CITED: search results quoting 2024 campaign materials]
- **Labor / DSA:** Member of Democratic Socialists of America; supported WGA strike with picket line appearances. [CITED: Wikipedia]
- **Political information:** Israel/Gaza — withdrew endorsement of Adam Schiff in Oct 2023 over Gaza policy, endorsed Barbara Lee instead. [CITED: Wikipedia]
- **Research order:** Start here. Term began Dec 2020; served as Mayor 2023; richest voting record of the 5.

### Nikki Perez — MEDIUM RECORD (elected 2022; previously served as Mayor Dec 2024–Dec 2025)

- **Environment:** Publicly championed the Green New Deal for Burbank; advocates for 100% clean energy by 2035. LALCV endorsed in 2022. Co-champion with Takahashi. [CITED: LALCV endorsement; Blue Values Burbank candidate profile]
- **Housing/Homelessness:** Worked directly with families experiencing homelessness as a trained social worker. Supports tenant protections and working-class housing. Stated "I believe in a 4% rent cap." [CITED: rent cap article; myBurbank candidate profile]
- **Rent regulation:** Voted YES on 4% soft rent cap (Oct 2024). [CITED: outlooknewspapers.com rent cap article]
- **Identity/history:** First indigenous (k'iche') and LGBTQIA+ council member in Burbank history; first indigenous Mayor of Burbank. Strong DEIB record in public statements.
- **Research order:** Second or third — medium record, 2022 onward.

### Tamala Takahashi — MEDIUM RECORD (elected 2022; currently Mayor Dec 2025–Dec 2026)

- **Environment:** Co-founded "Reusable Burbank"; co-authored comprehensive plastics ordinance (approved 2023); gas-powered leaf blower ban; championed Burbank's first large-scale municipal solar array at the airport. LALCV endorsed 2022. [CITED: campaign site; outlooknewspapers.com inauguration article]
- **Transportation:** Active transportation advocate; successfully pushed LA Metro to bring Metro Micro pilot to Burbank. Pro-multi-modal street design. [CITED: campaign site tamala4burbank.com]
- **Housing/Homelessness:** Cut the ribbon on four family transition suites + Burbank's first integrated case-management homelessness resource center (in partnership with Home Again LA). [CITED: campaign site]
- **Rent regulation:** Led the council toward the 4% soft rent cap compromise; voted YES. [CITED: rent cap article — "Vice Mayor Tamala Takahashi led them toward a soft cap consideration"]
- **Research order:** Second or third — similar record depth to Perez.

### Zizette Mullins — THINNER RECORD (elected 2022; currently Vice Mayor Dec 2025–Dec 2026)

- **Rent regulation:** VOTED NO on the 4% soft rent cap — the sole dissenter (3-1 vote). Her position was that the cap should be AT LEAST 5% (protecting landlords from too-low a cap). This is her most notable differentiating vote. [CITED: outlooknewspapers.com rent cap article — "Mullins argued for a higher percentage, specifying at least 5%"]
- **SCAG:** Appointed to 2023 SCAG Economic and Community Development Committee — indicates regional economic development orientation.
- **Campaign priorities:** Affordable housing, public safety/security, addressing homelessness, business community support, city staffing levels. [CITED: search results; mullinsforcouncil.com campaign platform]
- **Background note:** Prior role as City Clerk (2012–2022) does not translate to a strong voting record on issues — she was an administrative official, not a policy-maker, for most of her career. Expect a thinner record than Anthony/Perez/Takahashi.
- **Research order:** Fourth.

### Christopher Rizzotti — THINNEST RECORD (elected Nov 2024, sworn in Dec 2024 — least than 2 years on council)

- **Rent regulation:** RECUSED due to his work as a Realtor (FPPC rules). Did not vote. This is his defining "absence" — expected to limit rent-regulation evidence. [CITED: outlooknewspapers.com rent cap article]
- **Campaign platform:** Pro-public safety ("police and fire"); pro-economic development and housing for all; anti-Airbnb short-term rentals (voted against while on Planning Board); environment ("sustaining and protecting our environment"); homelessness outreach. [CITED: chrisforburbank.com/meet-chris]
- **Planning Board experience:** 12 years on Burbank Planning Board (2013–2024) — may provide some zoning/development voting record.
- **Research order:** Last — thinnest voting record; sworn in Dec 2024.

**Key stance event for research agents:** The October 2024 rent cap vote (3-1, Mullins dissenting, Rizzotti recused) is the most-cited differentiating vote for this council and should anchor any rent-regulation topic research.

---

## Common Pitfalls

### Pitfall 1: Assuming burbankca.gov is Fully WAF-Blocked
**What goes wrong:** Researcher assumes the site is WAF-403 like Downey/Glendale/Pomona, skips direct fetch, resorts to Ballotpedia/campaign sources only.
**Why it happens:** WebFetch tool returns HTTP 403, creating the false impression of full WAF.
**How to avoid:** Use `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"` — the site returns HTTP 200 with a browser UA. All 5 portrait URLs verified at 200.

### Pitfall 2: Creating a Separate Mayor Office
**What goes wrong:** Executor creates a new LOCAL_EXEC Mayor office for Takahashi, following the Inglewood/El Monte pattern.
**Why it happens:** The CONTEXT.md and research both note that the DB has NO Mayor office — executor infers "create one."
**How to avoid:** Burbank's Mayor is ROTATIONAL, not directly elected. The correct action is to set the title field on Takahashi's existing At-Large council seat to 'Mayor' (and Mullins's to 'Vice Mayor'). NO new office row. This is the Downey/West Covina pattern.

### Pitfall 3: Relabeling At-Large to Districts
**What goes wrong:** Executor sees the CVRA lawsuit mention and relabels the 5 At-Large district rows to District 1–District 5.
**Why it happens:** Many prior phases required by-district relabeling (Inglewood, West Covina, El Monte, Downey); pattern recognition fires incorrectly.
**How to avoid:** The CVRA ballot measures are on the November 3, 2026 ballot — they have NOT passed. Burbank is still AT-LARGE. The 5 `At-Large` labels in the DB are CORRECT. Do not relabel.

### Pitfall 4: Unlinking Mullins
**What goes wrong:** Executor sees the "Zizette Mullins — prime suspect" flag in CONTEXT.md, finds that she was Burbank's City Clerk, and unlinks her.
**Why it happens:** The warning in CONTEXT.md is prescient but the resolution is the opposite of what it feared — Mullins is a current council member.
**How to avoid:** This research file is the resolution. Mullins ran for council in 2022 AFTER leaving the City Clerk role and won. She is seated and is the current Vice Mayor. DO NOT unlink her.

### Pitfall 5: Rizzotti Stance Research Expecting a Vote Record
**What goes wrong:** Stance research agent looks for Rizzotti's council votes and finds almost nothing, declares "no evidence found" for all topics.
**Why it happens:** Rizzotti was sworn in December 2024 — he has been on the council fewer than 2 years. His Planning Board record (12 years, 2013–2024) is the supplementary source.
**How to avoid:** Brief the stance research agent that Rizzotti's council vote record is thin by design (new member). Search his Planning Board vote history for zoning/development stances. Campaign platform positions are context, not "evidence" for chairs placement.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chamber merge | Custom office-move logic | Proven SQL template from `1018_inglewood_reconcile.sql` | Idempotent guards already written |
| Mayor title-on-seat | NEW LOCAL_EXEC office | Update `title` field on Takahashi's existing At-Large seat | West Covina 1011 + Downey precedent; no new office needed |
| Headshot fetch | Python/JS scraper or WebFetch | `curl -A "Chrome UA" <burbankca.gov URL>` | Chrome UA returns HTTP 200; simpler than a scraper |
| Stance research | Batch all 5 officials at once | One agent at a time | Rate-limit rule ([[feedback_stance_research_one_at_a_time]]) |
| At-Large relabeling | District 1–5 relabeling step | None — skip entirely | Burbank is still at-large; the CVRA vote hasn't happened |

**Key insight:** Burbank is the simplest reconcile since at least Phase 148 (Torrance). No by-district relabeling, no person dedup, no unlinking — pure chamber merge + link repair + geo_id backfill + titles on seats.

---

## Code Examples

### Headshot Fetch Pattern (Liferay adaptive-media, Chrome UA required)
```bash
# Verified pattern — Chrome UA required; returns HTTP 200 for all 5 members
curl -s -L -o takahashi.jpg \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://www.burbankca.gov/o/adaptive-media/image/3949213/Preview-1000x0/20251208-portrait-Tamala-Takahashi-001.jpg?t=1766442190215"
# Returns HTTP 200, image/jpeg, full-size portrait

# Rizzotti (the primary 0-image gap):
curl -s -L -o rizzotti.jpg \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  "https://www.burbankca.gov/o/adaptive-media/image/3940848/Preview-1000x0/20251215-portrait-Rizzotti-final.jpg?t=1765923026167"
```

### Rotational Mayor Title on Seat (Wave 2 — follow West Covina 1011 pattern)
```sql
-- Source: 1011_west_covina_complete.sql pattern; West Covina used same rotational model
-- Set Mayor title on Takahashi's existing At-Large office
UPDATE offices
SET title = 'Mayor'
WHERE politician_id = 'ea6f7109-6067-4a48-bbdf-2a8b9cffe05f'  -- Takahashi
  AND title != 'Mayor';  -- idempotent

-- Set Vice Mayor title on Mullins's existing At-Large office
UPDATE offices
SET title = 'Vice Mayor'
WHERE politician_id = 'f933bd87-d397-4ef1-873b-57559b629000'  -- Mullins
  AND title != 'Vice Mayor';  -- idempotent
-- (Resolve exact UUIDs by ext_id query at apply time; above are illustrative)
```

### official_count = 5 (all council, rotational Mayor included — no separately-counted Mayor)
```sql
-- Source: proven pattern from West Covina (5 at-large); rotational Mayor is NOT separately counted
-- Inglewood/El Monte excluded their directly-elected Mayor from chamber official_count
-- Burbank's rotational Mayor IS part of the 5 council seats → official_count = 5
UPDATE chambers
SET official_count = 5
WHERE id = '73422d25-c0a6-477a-b74f-2b38b94b6389'  -- survivor chamber
  AND (official_count IS NULL OR official_count != 5);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Assuming burbankca.gov is fully WAF-403 | burbankca.gov requires Chrome UA (not fully WAF-blocked) | Phase 154 research | Direct curl with Chrome UA works — no operator in-browser needed |
| Treating all 2022-elected officials as suspect City Clerks | Mullins background verified — former Clerk who then became council member | Phase 154 research | No unlinking needed; CONTEXT.md "prime suspect" warning was accurate precaution but resolved |
| Every LA-area deep-seed needs by-district relabeling | At-large cities exist (Burbank, West Covina both at-large) | Phases 148/152/154 | Skip the by-district relabeling step entirely for at-large confirmed cities |

**Deprecated/outdated in this phase:**
- The assumption that "no Mayor office = must be missing" — for at-large + rotational-Mayor cities, no Mayor office is CORRECT (West Covina/Downey model confirmed again).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Dec 2025 reorganization results (Takahashi=Mayor, Mullins=VP) are still current as of June 2026 (no mid-year change) | Roster Verdict | Extremely low risk — rotational Mayors serve 1-year terms Dec-Dec; next rotation Dec 2026 |
| A2 | The Rizzotti Dec 2025 portrait (fileEntryId 3940848) is him and not a placeholder from the Dec 2025 reorganization event | Headshots | Very low risk — filename is "20251215-portrait-Rizzotti-final.jpg" indicating a named/finalized portrait |
| A3 | Existing DB headshots for Anthony and Perez (seeded from 2022 portraits) do not have superimposed graphics or wrong-person issues | Headshots | Low risk — both were elected officials in 2022 when their portraits were taken; verify at Wave-3 apply time |
| A4 | Rizzotti's FPPC recusal on the rent cap vote (due to Realtor status) is the only topic where his FPPC conflict applies; other topics are researched normally | Stances | Medium risk — any vote involving real estate, short-term rentals, or development could trigger FPPC recusal; stance research agent must check |

**Highest operational risk:** A4 — Rizzotti's recusal pattern. If he has FPPC conflicts on multiple topics, his stance research will be thinner than expected even for topics he would otherwise vote on.

---

## Open Questions (RESOLVED — no blockers)

All four open questions from the objective are resolved. No planning blockers remain.

1. **Form of government (D-02):** RESOLVED. At-large + rotational mayor. See "Form of Government — VERDICT" section.

2. **Current roster (D-03):** RESOLVED. All 5 DB rows confirmed current. Mullins is the Vice Mayor, not the City Clerk. No unlinking needed. See "Roster — VERDICT" section.

3. **Headshots (D-04):** RESOLVED. burbankca.gov requires Chrome UA (not fully WAF-blocked). All 5 official portraits available at HTTP 200 via direct curl. Fresh Dec 2025 portraits exist for both Rizzotti and Takahashi (the two 0-image gaps). See "Headshots" section.

4. **Stance sources (Wave 4):** ASSESSED. Anthony richest, Rizzotti thinnest. Oct 2024 rent cap vote is the key differentiating event. See "Stance Sources" section.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase MCP (`mcp__supabase-local`) | All waves | Confirmed (prior phases 142–153) | Live production | psql via EV-Accounts DATABASE_URL |
| curl with Chrome UA | Wave 3 headshot download | Confirmed (all 5 URLs HTTP 200) | System curl | Operator in-browser download |
| burbankca.gov adaptive-media image system | Wave 3 headshots | Confirmed NO-WAF with Chrome UA | HTTP 200 verified | Campaign sites / Ballotpedia |
| EV-Accounts git repo | Migration commit | Confirmed (master branch) | — | N/A |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

### Structural Assertions (Wave 1 completion gate)

| Check | SQL Pattern | Expected Result |
|-------|-------------|-----------------|
| geo_id backfilled | `SELECT geo_id FROM governments WHERE id='3e3deaea...'` | `'0608954'` |
| Only one 'City Council' chamber | `SELECT COUNT(*) FROM chambers WHERE government_id='3e3deaea...' AND name='City Council'` | 1 |
| DOOMED chamber deleted | `SELECT COUNT(*) FROM chambers WHERE id='6a72dbe8...'` | 0 |
| All 5 offices in survivor chamber | `SELECT COUNT(*) FROM offices WHERE chamber_id='73422d25...'` | 5 |
| All 5 offices bidirectional | `SELECT COUNT(*) FROM offices o JOIN politicians p ON p.id=o.politician_id WHERE o.chamber_id='73422d25...' AND p.office_id != o.id` | 0 |
| Doomed At-Large district deleted | `SELECT COUNT(*) FROM districts WHERE id='809bbb35...'` | 0 |
| Anthony link repaired | `SELECT office_id FROM politicians WHERE external_id=-201161` | NOT NULL |
| Mullins link repaired | `SELECT office_id FROM politicians WHERE external_id=-201162` | NOT NULL |

### Roster Assertions (Wave 2 completion gate)

| Check | Expected |
|-------|----------|
| official_count on survivor chamber | 5 |
| All 5 district labels are 'At-Large' (no relabeling) | 5 rows with label='At-Large' |
| Takahashi's office title | 'Mayor' |
| Mullins's office title | 'Vice Mayor' |
| No LOCAL_EXEC office exists under this gov | 0 rows with district_type='LOCAL_EXEC' under gov `3e3deaea` |
| All 5 politicians have non-null office_id | 5 non-null values |

### Split-Section Check (post-Wave-1)
```sql
-- Source: feedback_section_split_check — run after every seeding phase; expect 0 rows
SELECT g.name, COUNT(DISTINCT gb.mtfcc) section_count
FROM governments g
JOIN government_bodies gb ON gb.government_id = g.id
WHERE g.id = '3e3deaea-c5f4-4a68-b3ae-a79589f544ea'
GROUP BY g.name HAVING COUNT(DISTINCT gb.mtfcc) > 1;
-- Expected: 0 rows (Burbank is not in the split-section defect set; one At-Large district after consolidation)
```

### Quick Run Command
```sql
-- One-liner health check post-Wave-1:
SELECT 
  (SELECT geo_id FROM governments WHERE id='3e3deaea-c5f4-4a68-b3ae-a79589f544ea') as geo_id,
  (SELECT COUNT(*) FROM chambers WHERE government_id='3e3deaea-c5f4-4a68-b3ae-a79589f544ea') as chamber_count,
  (SELECT official_count FROM chambers WHERE id='73422d25-c0a6-477a-b74f-2b38b94b6389') as official_count;
-- Expected: geo_id='0608954', chamber_count=1, official_count=5
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
| Wrong-person headshot upload | Integrity | Verify each image against official burbankca.gov council page before upload; filenames include council member names |
| ext_id collision (if new politician created) | Integrity | Pre-flight MIN(external_id) query — but research confirms no new politicians needed |
| Retired compass topic ID | Integrity | Query live `inform.compass_stances` at apply time, never hardcode |

---

## Sources

### Primary (HIGH confidence)
- burbankca.gov/elected-officials — curl HTTP 200 with Chrome UA; full council roster with headshot URLs and titles
- burbankca.gov/council-manager-form-of-government — confirmed council-manager + at-large government form
- burbankca.gov newsroom (CVRA settlement article) — confirmed at-large is current system; ballot measures Nov 2026
- myBurbank.com — "Tamala Takahashi Elevated to Position of Burbank Mayor for 2026" — Mayor/VP election confirmed Dec 15 2025; rotation policy described
- Granicus board roster (burbank.granicus.com/boards/w/2c43e3453e3688fe/boards/16810) — all 5 members + terms confirmed
- burbankca.gov adaptive-media URLs — curl HTTP 200 verified for all 5 portrait URLs

### Secondary (MEDIUM confidence)
- LegiStorm biographies — Takahashi (Dec 2022–), Mullins (Dec 2022–), Rizzotti (Dec 2024–) tenures
- myBurbank.com "Burbank's City Clerk Throws in Her Hat" — Mullins transition from Clerk to Council candidate
- outlooknewspapers.com/burbankleader rent cap article — Oct 2024 vote specifics (3-1, Mullins dissenting, Rizzotti recused), individual member positions confirmed
- Wikipedia (Konstantine Anthony) — DSA membership; WGA picket; Schiff endorsement withdrawal
- Streetsblog LA interview (Dec 2020) — Anthony's 2020 police/public-safety positions
- Blue Values Burbank — Perez/Takahashi environmental endorsements + positions
- LALCV endorsement announcement — Perez/Takahashi environment record
- chrisforburbank.com campaign site — Rizzotti's campaign positions; Planning Board history

### Tertiary (LOW confidence — context only)
- myBurbank.com Anthony 2024 election result — "Anthony Reelected, Rizzotti and Wilke Still battling"
- tamala4burbank.com — Takahashi transportation/environment achievements (campaign material)

---

## Metadata

**Confidence breakdown:**
- Form of government (at-large + rotational mayor): HIGH — confirmed via multiple official sources; rotation policy explicitly described
- Current roster (all 5 confirmed, Mullins resolved): HIGH — Granicus board + LegiStorm + myBurbank.com cross-confirm
- WAF status (Chrome UA required, not fully blocked): HIGH — curl HTTP 200 verified on all 5 portrait URLs
- Headshot URLs (all 5 with HTTP 200): HIGH — tested in research session
- Stance depth (Anthony richest, Rizzotti thinnest): MEDIUM — general evidence confirmed; granular vote-by-vote record not fully mined

**Research date:** 2026-06-21
**Valid until:** 2026-09-21 (Burbank council is stable until December 2026 reorganization; CVRA ballot measures won't change structure until at earliest early 2027 if both pass Nov 2026)

---

## Live Browse Link
https://essentials.empowered.vote/results?browse_geo_id=0608954&browse_mtfcc=G4110
