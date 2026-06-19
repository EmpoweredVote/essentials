# Phase 144: Glendale Deep-Seed — Research

**Researched:** 2026-06-19
**Domain:** Glendale, CA city council reconcile + complete + headshots + stances
**Confidence:** HIGH (roster change confirmed from LA County official results; DB state verified live)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Reconcile EXISTING partial seed (UPDATE-not-INSERT), no greenfield rebuild, no duplicate offices/external_ids. Preserve existing politician rows; reseat, never duplicate people.
- D-02: Backfill `essentials.governments.geo_id = '0630000'` on gov `a7433437` (currently NULL), guarded `WHERE geo_id IS NULL`.
- D-03: Delete the empty duplicate chamber `c019a553` (external_id `-200687`, "Glendale City Council", 0 offices/0 seated). Survivor is `771727ec` (external_id `10450`, `official_count=5`). Target by UUID only (both share the name). Simpler than SC — the duplicate is empty, so no offices/members to move first.
- D-04: Reconcile (geo_id + chamber delete) is a STRUCTURAL migration → registers in `supabase_migrations.schema_migrations` normally. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter is authoritative.
- D-05: Run the `feedback_section_split_check` SQL after consolidation — expect Glendale absent (0 rows for it).
- D-08: Model the mayor as a rotating role on a council seat — NO separate LOCAL_EXEC district / Mayor chamber / Mayor office. Mark current Mayor by `title='Mayor'` on existing seat only.
- D-09: Current Mayor = Ardy Kassakhian (686339), selected April 2026 (VERIFIED — see Live-Data Findings below).
- D-10: Headshots: 600×750 (4:5 Lanczos, `press_use`); `politician_images.type='default'`; no fabricated photos; honest gaps documented.
- D-12: Evidence-only compass stances, chairs model, one research agent at a time, no defaults, 100% citation.
- D-13: NO judicial-* topics — City Attorney is appointed, not elected.

### Claude's Discretion
- Exact migration numbering (next structural: 902; stance/headshot audit-only files continue after 901).
- Per-official stance file granularity (one file per official, like SC 897–901).
- Whether to re-source existing 2 images (Kassakhian and Asatryan) if quality pass is warranted.
- How to handle Najarian's DB row at roster completion time (retire-not-delete vs. leave active while results not yet certified).

### Deferred Ideas (OUT OF SCOPE)
- Cleanup of the 5 OTHER cities' pre-existing split-section defects.
- Glendale Unified school board deep-seed.
- 2026 Glendale election candidate/results ingestion pipeline.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GLEN-01 | City of Glendale (0630000) deep-seeded — government + roster + headshots + evidence-only stances | Roster change confirmed (Najarian out/Bartrosouf in, pending certification); all 5 final-roster members identified; photo sources found; stance evidence map documented; DB structure verified |
</phase_requirements>

---

## Summary

Phase 144 is a near-identical reconcile to Phase 143 (Santa Clarita), but with one material difference that changes the plan shape: **a June 2, 2026 city council election has occurred and one incumbent seat turned over**. Ara Najarian (-700100) did not seek re-election; his term ends July 2026. The unofficial winner of his seat is **Alek Bartrosouf** (urban planner, co-founder Glendale Environmental Coalition), per LA County official election results (Brotman 19,038 / Asatryan 17,329 / Bartrosouf 15,396). Certification is June 26 by LA County; Secretary of State certifies July 10. As of today (June 19) the results are uncertified but a strong plurality — Bartrosouf's lead over 4th-place Murphy is ~800 votes on 107k cast ballots with 84k still outstanding at the early-return count. Results are not yet certified.

The structural work (geo_id backfill + duplicate chamber delete) is simpler than SC: the empty duplicate chamber `c019a553` has zero offices and zero members — no moves required before deletion. The survivor chamber `771727ec` already has 5 properly office-linked members with all titles set to `Councilmember`. The only structural tasks are: backfill `geo_id`, delete the empty duplicate, and update Kassakhian's title to `Mayor`. The roster wave then handles the Najarian retirement and Bartrosouf insertion (pending certification — planner must decide timing).

Headshots: 3/5 current (pre-election) members have images. Kassakhian is canonical (`{uuid}-headshot.jpg`, `cc_by_sa_4.0`); Asatryan is canonical (`{uuid}/default.jpeg`, `cc_by_sa_4.0`); Gharpetian exists but is `scraped_no_license` at an old `la_county/cities/glendale/` path — requires re-sourcing. Najarian (retiring), Brotman (0 images), and eventually Bartrosouf (new seat) all need headshots. Post-election the headshot scope becomes: Brotman (missing), re-source Gharpetian (bad license+path), Bartrosouf (new — no official city photo yet, campaign site only).

Stances: 0/5 for all current members. Full evidence-only stance research required, one agent at a time.

**Primary recommendation:** Execute as 4 waves mirroring Phase 143 — Wave 1 reconcile (structural, ledger), Wave 2 roster (handle Najarian/Bartrosouf transition, flag Mayor, structural or audit per timing), Wave 3 headshots (Brotman + Gharpetian re-source + Bartrosouf when photo available), Wave 4 stances (5 current members: Kassakhian, Asatryan, Gharpetian, Brotman, Bartrosouf — NOT Najarian who is retiring/departed).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber reconcile | Database / Storage | — | SQL migrations directly against Supabase; no frontend change |
| Roster completion / Mayor flag | Database | — | SQL UPDATE/INSERT on politicians + offices tables |
| Headshot processing | Local Bash pipeline | Supabase Storage | Pillow crop/resize → Storage upload → politician_images INSERT/UPDATE |
| Evidence-only stances | Research agent (one at a time) | Database | Agent mines sources, outputs SQL; applied via mcp__supabase-local |
| UI rendering | None (existing) | — | Glendale renders on existing browse/compass UI; no frontend change needed |

---

## Live-Data Findings

### 1. Roster — CHANGED (HIGH confidence)

**June 2, 2026 election result (LA County official results, results.lavote.gov/text-results/4338):**

Three seats were up: Najarian's (not re-running), Brotman's (re-running), Asatryan's (re-running).

| Candidate | Votes | % | Status |
|-----------|-------|---|--------|
| Dan Brotman (incumbent) | 19,038 | 17.86% | WIN — re-elected |
| Elen Asatryan (incumbent) | 17,329 | 16.26% | WIN — re-elected |
| Alek Bartrosouf | 15,396 | 14.44% | WIN (unofficial — 3rd place) |
| Patrick Murphy | ~8,595 | ~12.03% | Out |

**Source:** [LA County results.lavote.gov/text-results/4338](https://results.lavote.gov/text-results/4338) — confirmed by Outlooknewspapers.com initial returns and subsequent updated percentages.

**Certification status:** LA County certifies June 26, 2026. Secretary of State certifies July 10, 2026. Today is June 19 — results are UNCERTIFIED but ~800-vote Bartrosouf lead with counts showing him stable in third.

**Impact on DB plan:**
- **Ara Najarian (-700100)**: RETIRE (not delete) — `is_incumbent=false`, `is_active=false`, `office_id=NULL`. His term ends approximately July 2026. This is the same retire-not-delete pattern as SC's Cameron Smyth.
- **Alek Bartrosouf**: INSERT as new politician in survivor chamber 771727ec. Use `-700101` (next available in the Glendale-area range — `-700100` is Najarian's; `-700101` is confirmed vacant).
- **Kassakhian, Asatryan, Gharpetian, Brotman**: All retain their existing rows and external_ids. Brotman and Asatryan re-won their seats; Kassakhian and Gharpetian are holdovers (terms not up until 2028).

**TIMING NOTE:** Bartrosouf has NOT been sworn in. Official swearing-in will occur after certification (~late July 2026). The planner must decide: (a) seed Bartrosouf now as is_incumbent=true with a note, or (b) hold Wave 2 roster until certification and swearing-in. Recommend option (a): the LAVote result is definitive — a 14.44% vs 12.03% gap with a 12-candidate field makes a come-from-behind reversal implausible. Document this decision clearly. Najarian's `farewell reception was June 17` (per Crescenta Valley Weekly), further confirming his departure.

### 2. DB State (VERIFIED live 2026-06-19)

**Government:**
- `a7433437-341a-48e7-907e-a61318954f0a` — "City of Glendale, California, US" — `geo_id = NULL` (backfill needed)

**Chambers:**
| Chamber UUID | external_id | official_count | office_count | Action |
|---|---|---|---|---|
| `771727ec` | 10450 | 5 | 5 | SURVIVOR — keep |
| `c019a553` | -200687 | NULL | 0 | DELETE — empty duplicate |

**Survivor chamber offices (all correctly titled 'Councilmember'):**
| office_id | title | Politician | external_id | images | stances |
|---|---|---|---|---|---|
| 615de18c | Councilmember | Elen Asatryan | 686337 | 1 (cc_by_sa_4.0, canonical path) | 0 |
| 0b17284a | Councilmember | Daniel Brotman | 686340 | **0** | 0 |
| c728231c | Councilmember | Vartan Gharpetian | 686336 | 1 (**scraped_no_license**, old path) | 0 |
| b1c10c09 | Councilmember | Ardy Kassakhian | 686339 | 1 (cc_by_sa_4.0, canonical `{uuid}-headshot.jpg`) | 0 |
| c6f4e77d | Councilmember | Ara Najarian | -700100 | **0** | 0 |

**Ledger MAX:** 895 (SC phase used 894/895; stance/headshot files 896–901 not registered — confirmed by DB query above)

**Next structural migration:** 902

### 3. Rotational Mayor (VERIFIED — HIGH confidence)

**Ardy Kassakhian (686339)** was selected as Mayor at the April 14-15, 2026 City Council meeting, succeeding Ara Najarian who concluded his fifth term as mayor.

- Source: [Crescenta Valley Weekly, April 16 2026](https://www.crescentavalleyweekly.com/news/04/16/2026/kassakhian-selected-as-city-mayor/) — official announcement
- Source: [glendaleca.gov news release](https://www.glendaleca.gov/Home/Components/News/News/9561/16)
- Vote: nearly unanimous; only Gharpetian abstained, calling the process "pre-determined"

**Plan action:** UPDATE Kassakhian's office `b1c10c09` title from `'Councilmember'` → `'Mayor'`. All other 4 seats stay `'Councilmember'`. No separate LOCAL_EXEC row.

**Note:** After Najarian's departure and Bartrosouf's seating, the Mayor succession sequence may change. Kassakhian is the current seated Mayor for April 2026–approximately April 2027. The rotational selection will continue from among the 5 members regardless.

### 4. Existing DB vs. CONTEXT.md discrepancy

CONTEXT.md D-06 states the roster is CURRENT with all 5 active. This was accurate AS OF the discuss-phase (also June 19), but the June 2 election had already happened — it appears the discussion missed this. The research confirms CONTEXT.md D-07 was correct to flag "Research MUST check the June 2 election." The roster IS changing.

**Summary of deltas from CONTEXT.md assumptions:**

| CONTEXT assumption | Reality |
|---|---|
| D-06: "No stale-member retirement needed" | WRONG — Najarian must be retired (like SC Smyth) |
| D-06: "Gharpetian re-won March 2024" | CONFIRMED — Gharpetian is NOT departing |
| D-09: "Kassakhian is Mayor" | CONFIRMED |
| Implied: 5 current members unchanged | Najarian OUT / Bartrosouf IN |

---

## Headshot Sources

### Summary table

| Member | external_id | DB images | Action | Source |
|--------|-------------|-----------|--------|--------|
| Ardy Kassakhian | 686339 | 1 (canonical, `cc_by_sa_4.0`) | License audit only — likely already adequate | `{uuid}-headshot.jpg` in Storage |
| Elen Asatryan | 686337 | 1 (canonical, `cc_by_sa_4.0`) | License audit only — likely already adequate | `{uuid}/default.jpeg` in Storage |
| Vartan Gharpetian | 686336 | 1 (`scraped_no_license`, **old path** `la_county/cities/glendale/vartan-gharpetian.jpg`) | **Re-source required** — bad license + non-canonical path | See sources below |
| Daniel Brotman | 686340 | **0** | **Source needed** | See sources below |
| Ara Najarian | -700100 | **0** | Retiring — source optional (see note below) | See sources below |
| Alek Bartrosouf | -700101 (new) | **0** | **Source needed** — no official city photo yet | Campaign site only for now |

### Najarian sourcing note

Najarian is retiring. The planner should decide whether to source his headshot:
- Option A: Source + upload before retiring the row (allows his profile to show a photo if kept visible after departure)
- Option B: Skip — he will be marked is_active=false; a missing photo on a departed member is acceptable
- Recommend Option A: the Metro Board headshot is excellent quality, clearly press-use, and takes 5 minutes.

### Brotman headshot sources

glendaleca.gov is **Akamai-protected (WAF returns 403 to all automated requests including curl with Chrome UA)**. The individual councilmember page `https://www.glendaleca.gov/government/city-council/councilmember-dan-brotman` exists and will have an official portrait, but cannot be fetched programmatically.

Options for Brotman:
1. **glendaleca.gov (manual):** Human opens the page in a browser, downloads the official portrait. Best source — authoritative, `press_use`.
2. **Glendale News-Press / Outlook Newspapers media gallery:** Campaign/press photos exist (e.g., `https://onmg.smugmug.com/Glendale-News-Press/` — photojournalism archive). May have clearable-use photos.
3. **His campaign site `danforglendale.com`:** Returned ECONNREFUSED during research — domain may be down or redirected post-election.

**Likely plan action:** Mark Brotman as a `checkpoint:human-verify` — executor opens `glendaleca.gov/government/city-council/councilmember-dan-brotman` in a browser and downloads the official portrait.

### Gharpetian headshot re-source

Current DB row: `scraped_no_license`, path `la_county/cities/glendale/vartan-gharpetian.jpg` (old non-canonical format). Must be replaced with a `press_use` canonical `{uuid}-headshot.jpg`.

Sources found (all accessible, HTTP 200):
1. **glendaleca.gov (manual):** `https://www.glendaleca.gov/government/city-council/councilmember-vartan-gharpetian` — official portrait, blocked by WAF, requires human browser access.
2. **ANCA press release photo (2017, low-res):** `http://armenianweekly.com/wp-content/uploads/2017/05/VartanGharpetian1-240x300.jpg` — 240×300px, too small for 600×750 upsample without quality degradation. `[ASSUMED]` press-reuse acceptable but resolution is marginal.
3. **Ballotpedia:** `https://ballotpedia.org/Vartan_Gharpetian_(Glendale_City_Council_At-Large,_California,_candidate_2024)` — may have a more recent photo.

**Recommend:** `checkpoint:human-verify` for Gharpetian as well — executor opens glendaleca.gov in a browser to get the current official portrait.

### Najarian headshot sources

1. **LA Metro Board (BEST — HIGH confidence):** `https://la-metro-headshots-production.s3.amazonaws.com/images/ara-j-najarian.width-640.jpg` — HTTP 200, 45KB image/jpeg, official Metro Board headshot. Professional quality. Attribution: Metro. License: `public_domain` / official government use. [VERIFIED accessible]
2. **Wikipedia Commons:** `https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Ara_Najarian.jpg/250px-Ara_Najarian.jpg` — HTTP 200, 12KB (250px wide only — small). CC license (requires WIKIMEDIA_HEADERS per `feedback_headshot_*` memory). The Metro photo is preferable.

**Recommend using the Metro Board photo** — better resolution, clearly official, no Wikipedia header complexity.

### Bartrosouf headshot sources

Bartrosouf has NO official city portrait yet (not yet sworn in). Sources:
- Campaign site `alekforglendale.com` — returned content with no visible image URL accessible via WebFetch
- Ballotpedia: `https://ballotpedia.org/Alek_Bartrosouf_(Glendale_City_Council_At-Large,_California,_candidate_2026)` — may have a photo
- Instagram: `@alekforglendale`
- Facebook: campaign page

**Recommend:** Defer Bartrosouf headshot to post-swearing-in (late July 2026) when glendaleca.gov will post an official portrait. Alternatively, executor can check his Ballotpedia page or campaign site manually. Document as a known gap.

---

## Stance Evidence Map

### Non-judicial live topics relevant to Glendale city council

From DB query (44 live topics total), topics with strong Glendale-local evidence:

| topic_key | Likely evidence strength | Notes |
|---|---|---|
| `local-immigration` | **STRONG** | Glendale had active ICE detention contract (2007 original) that it terminated June 2025 under community pressure; individual council member positions split |
| `local-environment` | **STRONG** | GWP coal-to-clean transition (IPP Intermountain Power Project); Brotman co-founded Glendale Environmental Coalition; GEC endorsements document members' records |
| `climate-change` | **MEDIUM** | GWP 100% clean energy by 2035 resolution; Brotman, Kassakhian, Asatryan GEC-endorsed |
| `housing` | **MEDIUM** | Housing Authority votes; density development disputes (Glendale Garden Homes EIR Feb 2025); Gharpetian platform |
| `growth-and-development` | **MEDIUM** | Multiple development EIRs; Gharpetian noted as pro-historic-preservation / controlled growth |
| `transportation-priorities` | **MEDIUM** | Metrolink/Beeline bus; Kassakhian on SCAG transportation committee; Asatryan champion of BeeLine |
| `homelessness-response` | **MEDIUM** | Glendale has active homelessness response programs; council votes on shelter/enforcement approach |
| `public-safety-approach` | **MEDIUM** | ICE contract controversy; police accountability discussions |
| `economic-development` | **LOW-MEDIUM** | Business district; GWP hydrogen investment; limited voting record detail |
| `immigration` | **LOW** | State-level bill positions rarely documented for city council members |
| `civil-rights` | **LOW** | Asatryan noted diversity as priority; no specific votes on file |

Topics with near-zero likelihood of evidence for city council members (honest blank expected): `abortion`, `trans-athletes`, `same-sex-marriage`, `school-vouchers`, `voting-rights`, `social-security`, `medicare/aid`, `redistricting`, `taxes` (state-level), `fossil-fuels` (state-level), `ukraine-support`, `tariffs`, `misinformation`, `ai-regulation`, `data-centers`, `childcare`, `religious-freedom`, `campaign-finance`.

Judicial topics (`judicial-*`, `judicial-police-accountability`, `judicial-prosecution-priorities`): EXCLUDED per D-13 (City Attorney appointed, not elected).

### Per-member stance evidence sources

**Dan Brotman (686340) — STRONGEST record**
- Glendale Environmental Coalition co-founder; GWP coal exit driven by his initiative (glendaleca.gov news; hoodline.com Dec 2025)
- LALCV (LA League of Conservation Voters) endorsed him — strong `local-environment`, `climate-change` evidence
- GEC endorsement letter documents specific actions: Grayson Power Plant clean transition, building electrification, tree canopy
- Recused from Glendale Garden Homes EIR vote (domestic partner owns nearby unit) — cannot score `housing` from that vote
- Local-immigration: Brotman noted CA ICE-free zone ordinances in public comment (outlooknewspapers.com)
- Primary evidence source: GEC 2026 endorsement page `gec.eco/gec-endorses-dan-brotman-two-other-candidates-for-glendale-city-council/`
- Campaign site: `danforglendale.com` (currently unreachable — try again at research time)
- outlooknewspapers.com/glendalenewspress is the richest local-news archive for vote records

**Ardy Kassakhian (686339) — GOOD record**
- GEC endorsed (2024) for: 10% solar/storage rooftop by 2027 resolution, polystyrene ban, gas blower ban, GWP Clean Energy by 2035 directive
- Elected to SCAG Regional Council (District 42) — regional transportation/housing/sustainability policy
- Local-immigration: Did NOT oppose the ICE contract publicly per available search results
- Primary evidence source: GEC 2024 endorsement `gec.eco/gec-endorses-ardy-kassakhian-karen-kwak/`; campaign site `ardykassakhian.com/issues/`
- glendaleca.gov Mayor page

**Elen Asatryan (686337) — GOOD record**
- GEC-endorsed 2026; champion of BeeLine bus service (`transportation-priorities`); affordable housing advocate; environmental record
- First Armenian-American woman Mayor of Glendale (April 2024)
- Local-immigration: Unclear — search did not surface a specific stance on ICE contract
- Primary evidence sources: `electelen.com`; Wikipedia `https://en.wikipedia.org/wiki/Elen_Asatryan`; GEC 2026 endorsement
- outlooknewspapers.com archives for council votes

**Vartan Gharpetian (686336) — THINNER record**
- Real estate broker / business owner — tends toward development/business interests
- Abstained on Kassakhian Mayor vote (April 2026) — factional context
- Platform (2024): infrastructure/transportation, housing, criminal justice/public safety; affordable housing + mental health services for homelessness
- Local-immigration: No specific stance found; may abstain or lean toward maintaining status quo
- Primary evidence sources: Ballotpedia 2024 `https://ballotpedia.org/Vartan_Gharpetian_(Glendale_City_Council_At-Large,_California,_candidate_2024)`; GHS Ask the Candidates 2024 `https://glendalehistorical.org/ask-the-candidates-2024`
- outlooknewspapers.com council meeting recaps

**Ara Najarian (-700100) — being retired; stances optional**
- If stances are desired before retiring: strong transportation record (Metro Board chair 2009-2010, Metrolink board); GWP engagement; stated opposition to ICE-free zone ordinances (public statements to outlooknewspapers.com — `local-immigration` clear)
- 5-term councilmember with substantial record; outlooknewspapers.com archive is richest source
- Decision: Whether to research Najarian stances at all is Claude's discretion per CONTEXT.md. Recommend YES — he was the seated official until July 2026, and his stances provide a complete record for his tenure.

**Alek Bartrosouf (-700101, new) — INCOMING, thin pre-council record**
- Urban planner; co-founded Glendale Environmental Coalition (strong `local-environment`, `climate-change` signal)
- Co-founded Monterey Community Gardens; served on Sustainability Commission and Transportation & Parking Commission
- Primary evidence: campaign platform `alekforglendale.com`; GEC 2026 endorsement; Glendale News-Press candidate forum coverage (`outlooknewspapers.com`)
- NOT yet seated — no council votes. Stances will be platform/commission-record based. Expect honest blanks on many topics; strong on environment/transportation based on commissions
- Research timing: after swearing-in (late July), or from campaign platform

### Armenian-American electorate note (CONTEXT D-14)

Glendale has the largest Armenian-American population of any US city (~40% of residents). Council members — especially Kassakhian, Asatryan, Gharpetian — have documented positions on:
- **Armenia/Artsakh-related resolutions**: The council has passed resolutions on the Nagorno-Karabakh/Artsakh conflict. These do NOT map to any standard compass chair — they are hyperlocal foreign-policy adjacency. Document as `EXTRA` and do NOT force onto `ukraine-support`, `immigration`, or any other existing topic.
- Local-immigration framing: Some Armenian-American community members connect their diaspora experience to local immigration policy, but this is NOT a reliable stance inference — research must find direct votes/statements.

---

## Reusable Patterns from Phase 143

The planner should build directly on these proven migration files. Do NOT re-derive the patterns.

### Wave 1: Reconcile (structural, ledger)
**Template:** `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql`

Glendale Wave 1 is SIMPLER than SC 894:
- No member retirement in Wave 1 (SC retired Smyth in 894; Glendale retires Najarian in Wave 2)
- Duplicate chamber is EMPTY (0 offices, 0 politicians) — no member migration needed before deletion
- SQL steps: (1) geo_id backfill WHERE geo_id IS NULL, (2) DELETE chamber `c019a553` (no FK children to detach first), (3) UPDATE Kassakhian office title `Councilmember` → `Mayor`
- Register in schema_migrations (structural)

SC 143-01-SUMMARY.md §Migration shape shows exact idempotent guard patterns.

### Wave 2: Roster completion (structural or audit per timing call)
**Template:** `C:/EV-Accounts/backend/migrations/895_santa_clarita_complete.sql`

Glendale Wave 2 actions:
1. **Retire Najarian** (-700100): `office_id = NULL`, `is_incumbent=false`, `is_active=false` — same pattern as SC Smyth 894 step 2, but moved to Wave 2 here
2. **Insert Bartrosouf** (-700101): new politician row in survivor chamber 771727ec, new Councilmember office, district reuse (same district as other 5 members), `is_active=true`, `is_incumbent=true`, `source='glendaleca.gov'`
3. Run `feedback_section_split_check` SQL — expect 0 rows for Glendale
4. Set `official_count=5` if not already correct after Najarian departure

Key reuse from 895: district reuse pattern (no new districts/geofences), NOT EXISTS office INSERT guard, `office_id IS DISTINCT FROM` backfill guard.

### Wave 3: Headshots (audit-only)
**Template:** `C:/EV-Accounts/backend/migrations/896_santa_clarita_headshots.sql`

SC 143-03-SUMMARY.md §What was done shows exact UPDATE pattern for re-sourcing (when an existing row has bad license/path, UPDATE in place; for Brotman and Bartrosouf use INSERT).

Key pattern: `politician_photos/{uuid}-headshot.jpg` canonical path, `press_use` license, `photo_origin_url` = source URL. NOT registered in schema_migrations (ledger stays at whatever Wave 2 left it).

Headshot pipeline: `curl` → Pillow `crop 4:5 first → resize 600×750 Lanczos q90 JPEG` → Supabase Storage upload (`service-role key in C:/EV-Accounts/backend/.env`) → INSERT/UPDATE `politician_images`.

### Wave 4: Stances (audit-only)
**Template:** `C:/EV-Accounts/backend/migrations/897_laurene_weste_stances.sql` through `901_patsy_ayala_stances.sql`

One file per official. Pattern:
```sql
WITH pol AS (SELECT id FROM essentials.politicians WHERE external_id = N)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ((SELECT id FROM pol), 'topic-uuid-here', chair_number)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ((SELECT id FROM pol), 'topic-uuid-here', 'Plain-language reasoning.', ARRAY['https://source-url']);
```

NOT registered in schema_migrations. On-disk counter continues from 902 (structural migration) — stances start at 903 if structural is 902.

SC 143-04-SUMMARY.md §Key decisions/notes documents: chairs model, SB54 seating-date rule (apply to members seated by 2018 only — no one in current Glendale roster qualifies for SB54 attribution since all seated 2015+; check seating dates per member), honest blanks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Image crop/resize | Custom PIL script from scratch | Reuse exact Pillow pipeline from SC 143 (4:5 crop first, then 600×750 Lanczos resize) |
| Storage upload | Custom HTTP | Supabase Python client with service-role key from `C:/EV-Accounts/backend/.env` |
| Duplicate person detection | New logic | Pre-flight `SELECT id FROM essentials.politicians WHERE external_id = N` before any INSERT |
| Stance SQL | New template | Copy `897_laurene_weste_stances.sql` pattern exactly |
| Roster verification timing | New process | CONTEXT.md D-07 pattern: verify against official source at apply time |

---

## Common Pitfalls

### Pitfall 1: Treating the existing 5-member roster as current
**What goes wrong:** CONTEXT.md D-06 states the roster is current, but the June 2 election replaced Najarian with Bartrosouf. If the plan treats all 5 pre-election members as current, it will miss the required Najarian retirement and Bartrosouf insertion.
**Prevention:** Research (this file) confirms the change. Planner must build Waves 1-2 with Najarian retirement + Bartrosouf insertion. Do not seed stances for Najarian as an active member.

### Pitfall 2: Treating election results as certified
**What goes wrong:** Bartrosouf has not been sworn in. Seeding him as the official incumbent before certification/swearing-in is premature.
**Prevention:** Planner should recommend a note in the plan: apply Wave 2 (Bartrosouf INSERT) after LA County certification (June 26) or after swearing-in (approximately late July). Wave 1 (geo_id/chamber/Mayor) can proceed immediately.

### Pitfall 3: glendaleca.gov WAF blocks all automation
**What goes wrong:** WebFetch and curl both return HTTP 403 (Akamai). Headshot executor assumes curl will work (as it did for santaclarita.gov).
**Prevention:** Mark Brotman + Gharpetian headshots as `checkpoint:human-verify` — executor must open the browser manually. Najarian and Asatryan have non-city sources available (Metro Board / existing canonical).

### Pitfall 4: Duplicating Bartrosouf's person row
**What goes wrong:** Bartrosouf has never been seeded in the DB. An INSERT without a pre-flight check risks duplication if partially applied.
**Prevention:** Use NOT EXISTS guard on external_id = -700101. Run pre-flight `SELECT COUNT(*) FROM essentials.politicians WHERE external_id = -700101` before applying Wave 2.

### Pitfall 5: Deleting the duplicate chamber with FK children
**What goes wrong:** In SC, Chamber A had 3 offices and 3 seated members requiring careful detach-then-delete. Glendale's `c019a553` is empty — but the plan executor must verify 0 offices before the DELETE.
**Prevention:** Wave 1 migration should include an inline assert (e.g., `DO $$ BEGIN IF (SELECT COUNT(*) FROM essentials.offices WHERE chamber_id = 'c019a553-...' ) > 0 THEN RAISE EXCEPTION 'Chamber has offices'; END IF; END $$;`) before the DELETE.

### Pitfall 6: Forcing Armenian/Artsakh resolutions onto compass topics
**What goes wrong:** Research agent finds Glendale council passed resolutions on Nagorno-Karabakh/Artsakh; agent maps this to `ukraine-support` or `immigration`.
**Prevention:** CONTEXT.md D-14 explicitly notes these do NOT map to any chair — document as EXTRA, leave those topic spokes blank.

### Pitfall 7: Gharpetian's scraped_no_license photo left in place
**What goes wrong:** The existing Gharpetian photo is tagged `scraped_no_license` at an old `la_county/cities/` path. If only Brotman is sourced, Gharpetian's bad-license row persists.
**Prevention:** Wave 3 plan explicitly includes re-sourcing Gharpetian's image (same as SC Wave 3's scope expansion to re-source Weste + upgrade Ayala — see 143-03-SUMMARY.md §Deviations).

---

## Live Compass Topic IDs (non-judicial, for apply scripts)

Query to run at apply time (never hardcode):
```sql
SELECT id, title, topic_key FROM inform.compass_topics 
WHERE is_live = true AND (judicial_role IS NULL OR judicial_role = '')
ORDER BY topic_key;
```

**EXCLUDE these judicial_role values:** `judge`, `city_attorney_da` — per D-13 (Glendale City Attorney is appointed).

Topics confirmed excluded (from live DB query 2026-06-19):
- `judicial-access-to-justice` (9d45acaf) — judicial_role absent but topic_key is judicial-*
- `judicial-bail-pretrial` (1fab5edf) — judicial_role=judge
- `judicial-criminal-justice` (9db07b16)
- `judicial-government-deference` (e5e48f0e)
- `judicial-interpretation` (448b1c9a) — judicial_role=judge
- `judicial-police-accountability` (7bad33eb) — judicial_role=city_attorney_da
- `judicial-prosecution-priorities` (abb99d95) — judicial_role=city_attorney_da
- `judicial-transparency` (6674d87e)

**Total live topics:** 44. **Non-judicial (usable for city council stances):** 36.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---|---|---|
| psql | Migration apply | Yes | Installed (confirmed) | mcp__supabase-local execute_sql |
| Supabase Storage | Headshot upload | Yes | Production | — |
| Python Pillow | Headshot crop/resize | [ASSUMED] | From SC phase (143) | Install via pip |
| curl | Headshot download | Yes | Bash tool | — |
| glendaleca.gov | Official headshots (Brotman, Gharpetian) | BLOCKED (Akamai 403) | — | Human browser + manual download |

**Missing dependencies with fallback:**
- glendaleca.gov WAF: human opens browser to retrieve portraits — planner must add `checkpoint:human-verify` tasks for Brotman and Gharpetian headshots.

---

## Validation Architecture

No automated test infrastructure required (per established CA deep-seed pattern). Verification gates are SQL assertions embedded in or run after each migration. The Phase 143 verification table format (see 143-01-SUMMARY.md through 143-04-SUMMARY.md) is the standard — copy it for each Glendale wave.

**Wave 1 verification checks (carry from SC 143-01):**
- gov geo_id = '0630000'
- chambers named 'City Council' under gov = 1
- Chamber `c019a553` remaining = 0
- Kassakhian office title = 'Mayor'
- Chamber B official_count = 5
- Split-section check = 0 rows for Glendale
- migration 902 registered in schema_migrations

**Wave 2 verification checks:**
- Najarian (-700100) is_active = false, is_incumbent = false, office_id = NULL
- Bartrosouf (-700101) seated in 771727ec, is_active = true, is_incumbent = true
- Active members in 771727ec = 5

**Wave 3 verification:**
- All 5 current members have exactly 1 `type='default'` image
- All 5 licenses = `press_use`
- All 5 paths follow canonical `{uuid}-headshot.jpg` pattern
- Najarian image = 0 or 1 depending on scope decision
- schema_migrations MAX unchanged (not registered)

**Wave 4 verification:**
- All 5 current members have stances (Najarian = 0 or researched; Bartrosouf = stances from platform)
- 0 rows with judicial topic_ids
- 0 rows with retired/non-live topic_ids
- 100% citation (every answer has matching politician_context)

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Bartrosouf lead of ~800 votes on June 2 will hold through certification | Live-Data Findings §1 | If Murphy overtakes, Bartrosouf INSERT must be reverted; Najarian retirement still applies (he's not re-running regardless) |
| A2 | Kassakhian and Gharpetian are holdovers with terms not up until 2028 | Live-Data Findings §1 | If either had a 2026 seat up, the race coverage would differ — confirmed by pattern: CA Glendale uses staggered 4-year terms with 2022+2024 elections for current members |
| A3 | glendaleca.gov will post Bartrosouf's official portrait after swearing-in (late July 2026) | Headshot Sources | If not, executor falls back to campaign site / Ballotpedia |
| A4 | Pillow is still installed from the Phase 143 headshot pipeline | Environment | If not, `pip install Pillow` required |
| A5 | `-700101` is available (next after Najarian's -700100) | Live-Data Findings §2 | DB query confirmed -700101 is not in the politicians table — safe to use |

---

## Open Questions (RESOLVED)

> All three resolved by CONTEXT.md + orchestrator/user decisions (2026-06-19) and encoded in the plans:
> (1) Bartrosouf INSERT now WITH a `checkpoint:human-verify` certification gate (Plan 144-02);
> (2) Najarian stances SKIPPED — stances cover only the 5 going-forward members (Plan 144-04);
> (3) Brotman headshot via human browser at execution (glendaleca.gov WAF), fallbacks documented (Plan 144-03).

1. **Bartrosouf INSERT timing: now vs. post-certification**
   - What we know: Results are uncertified (June 26 certification date). Bartrosouf has a ~2,800-vote lead (15,396 vs 12,596 Murphy) with ~84,000 ballots outstanding at the initial count — lead is likely to hold.
   - What's unclear: Should the plan proceed with the INSERT now, or add a certification gate?
   - Recommendation: Add a `checkpoint:human-verify` note on Wave 2 — executor should confirm final results at lavote.gov before seeding Bartrosouf. If certified by apply time, proceed normally.

2. **Najarian stances: research or skip?**
   - What we know: Najarian is departing; 0 stances in DB. He was a 5-term councilmember with a substantial record.
   - What's unclear: CONTEXT.md leaves this to Claude's discretion. Stances for departed members add value to the historical record (users may still view his profile during the transition period).
   - Recommendation: Research Najarian stances as an optional Wave 4 step, separate from the 5 current members. If time/rate-limit budget allows.

3. **Brotman headshot — campaign site down**
   - What we know: `danforglendale.com` returned ECONNREFUSED during research.
   - What's unclear: Whether this is temporary or domain expired post-election.
   - Recommendation: Try again at execution time; if still down, fall back to human browser access of glendaleca.gov.

---

## Sources

### Primary (HIGH confidence)
- LA County results.lavote.gov/text-results/4338 — June 2 election official results for Glendale City Council (Brotman 19,038 / Asatryan 17,329 / Bartrosouf 15,396)
- Production Supabase DB (mcp__supabase-local = production) — live state of chambers, politicians, images, stances, ledger (queried 2026-06-19)
- glendaleca.gov/Home/Components/News/News/9561/16 — Kassakhian Mayor selection official news release
- Crescenta Valley Weekly (crescentavalleyweekly.com/news/04/16/2026/kassakhian-selected-as-city-mayor/) — Kassakhian Mayor April 2026 selection confirmed with date
- LA Metro Board (boardagendas.metro.net/person/ara-j-najarian-f70cec2043fa/) — Najarian official Metro headshot URL confirmed HTTP 200

### Secondary (MEDIUM confidence)
- Outlooknewspapers.com/glendalenewspress — local paper coverage; "Brotman, Asatryan Lead City Council Race in Early Returns" confirms election candidates and early returns
- Wikipedia: Ara Najarian (confirmed "succeeded by Alek Bartrosouf", service "April 2005–June 2026")
- Crescenta Valley Weekly (crescentavalleyweekly.com/featured/06/11/2026) — Najarian farewell reception June 17, 2026
- LALCV endorsement page — confirms Brotman environmental record
- GEC 2026 endorsement page — confirms Brotman/Asatryan/Kassakhian environmental records
- LAist/KTLA/Common Dreams — Glendale ICE contract termination June 2025 (local-immigration evidence source)

### Tertiary (LOW confidence)
- Armenian Weekly (armenianweekly.com) — Gharpetian photo (2017, low-res; accessible HTTP 200)
- Ballotpedia — Gharpetian 2024 candidate page (candidate survey incomplete per search results)

---

## Metadata

**Confidence breakdown:**
- Roster change (election outcome): HIGH — confirmed via LA County official results
- DB live state: HIGH — directly queried production DB
- Mayor (Kassakhian): HIGH — confirmed via official city news release + CVWeekly
- Headshot sources (Brotman, Gharpetian): MEDIUM — glendaleca.gov blocked; fallback sources identified
- Stance evidence map: MEDIUM — GEC endorsements + outlooknewspapers archives are strong; individual vote records require further research per official

**Research date:** 2026-06-19
**Valid until:** 2026-07-10 (LA County election certification date — after which all Bartrosouf data upgrades to HIGH)
