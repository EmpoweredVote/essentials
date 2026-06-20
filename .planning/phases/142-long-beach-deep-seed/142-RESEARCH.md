# Phase 142: Long Beach Deep-Seed — Research

**Researched:** 2026-06-19
**Domain:** CA city government — reconcile + complete + stances (NOT greenfield)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Frame Phase 142 as **reconcile + complete + stances**, NOT greenfield. Start from verified existing DB state. Re-seeding from scratch would duplicate offices and collide with existing external_ids.
- **D-02:** Include all three directly-elected citywide officers — **City Attorney, City Prosecutor, City Auditor**. Unlike SF/Sacramento/Fremont (appointed), Long Beach elects them citywide.
- **D-03:** Seat the **missing 9th council district** (D8 — Tunua Thrash-Ntuk, elected Dec 2024). Document honestly if vacant — do not invent an officeholder.
- **D-04:** **LBUSD school board out of scope** — city government only.
- **D-05:** Stances run **in-phase, end-to-end, as the final wave** — after structure reconciliation + headshots settled. Evidence-only, one research agent at a time, ALL live compass topics, no default values, honest blank spokes.
- **D-06:** Keep the **flat single-LOCAL** district pattern — all council seats share `geo_id=0643000`. Do NOT create per-district geofences.
- **D-07:** Backfill `essentials.governments.geo_id = '0643000'` (currently NULL).
- **D-08:** Rename the **Mayor's chamber** (the 1-office LOCAL_EXEC one, id `867f4e3f`) from 'Long Beach City Council' to a distinct name to prevent split-section bugs.
- **D-09:** Dedupe officials with 2 `politician_images` rows down to one `type='default'` (600×750). Cindy Allen, Megan Kerr, Roberto Uranga each have 2 rows.
- **D-10:** Back-fill `politicians.office_id` for Rex Richardson (bidirectional link is NULL).
- **D-11:** New officials (4 total: Tunua Thrash-Ntuk D8 + 3 citywide officers) use **reserved range `-700050 … -700099`** (all 50 slots currently empty — DB-verified). NOT the milestone's generic geo_id-prefix scheme.
- **D-12:** Wave-2 greenfield assumption is wrong — every Wave-2 phase (143–156) must DB-pre-check before assuming greenfield.

### Claude's Discretion

None specified (all decisions were locked in CONTEXT.md).

### Deferred Ideas (OUT OF SCOPE)

- Wave-2 greenfield assumption fix in ROADMAP/STATE Key Facts — out of scope for Phase 142 execution.
- LBUSD elected Board of Education — deferred to a future school-board coverage milestone.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LBCH-01 | Long Beach (geo_id 0643000) deep-seeded — government + roster + headshots + evidence-only stances | Government structure confirmed; full 12-official roster verified against longbeach.gov; headshot CMS pattern documented; stance research protocol confirmed. |

</phase_requirements>

---

## Summary

Long Beach is a **reconcile + complete + stances** phase, not greenfield. A pre-check on 2026-06-19 confirmed the government row exists (but `geo_id` is NULL), two chambers both named 'Long Beach City Council' (split-section risk), Rex Richardson seated but with `politicians.office_id` NULL, 8 of 9 council seats filled, 3 duplicate image rows across two councillors, and zero stances.

The missing seat is **D8 — Tunua Thrash-Ntuk**, elected March 2024, sworn in December 17, 2024. She is the only new council hire. The three citywide elected officials NOT yet seated are **City Attorney Dawn McIntosh** (elected June 2022), **City Prosecutor Doug Haubert** (re-elected June 2022), and **City Auditor Laura L. Doud** (in office since 2006, term ends December 2026). All three are confirmed separately-elected citywide for four-year terms via the Long Beach City Charter.

Headshots for the new officials are accessible at direct JPEG URLs via the `longbeach.gov/globalassets/` CDN — no AEM/CQ5 CSS background-image extraction needed (Sacramento pattern does NOT apply here). The CMS pattern is: `https://www.longbeach.gov/globalassets/officials/media-library/images/{lastname}185x200.jpg`. Stances apply to all 12 officials (9 existing + Thrash-Ntuk + 3 citywide officers) using the standard evidence-only protocol.

**Primary recommendation:** Four migrations: (878) data-hygiene/reconcile, (879) seat D8 + add 3 citywide chambers/offices/politicians, (880) headshots for new officials + dedupe audit, then per-official stance migrations (877+N, no ledger entry). Total 12 officials for stance research.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government structure reconcile | Database / Storage | — | SQL-only: UPDATE gov geo_id, RENAME chamber, DELETE duplicate images, UPDATE politicians.office_id |
| New official seeding | Database / Storage | — | INSERT politicians + offices using reserved external_id range |
| Headshot upload | CDN / Static (Supabase Storage) | Database / Storage | Download 185×200 from longbeach.gov, crop 4:5, resize 600×750, INSERT politician_images |
| Stance ingestion | Database / Storage | — | INSERT inform.politician_answers + politician_context rows, raw SQL, no ledger entry |
| Routing / geofence | Database / Storage | — | Flat geo_id=0643000 already loaded (G4110); no new geofence work |

---

## Verified Existing DB State

All facts DB-verified via psql query 2026-06-19. [VERIFIED: live DB]

### Government Row
- `id = '5e5c3e0b-5479-4759-ac7e-2ea0aecabd38'`
- `name = 'City of Long Beach, California, US'`
- `geo_id = NULL` — must be backfilled to `'0643000'`

### Chambers (2 rows, both named 'Long Beach City Council')

| Chamber ID | Name | Offices | District type held | Action |
|-----------|------|---------|-------------------|--------|
| `2109e716` | City Council | 8 | LOCAL (council D1–D8, minus one empty) | Keep name; add 1 council office (D8) |
| `867f4e3f` | City Council | 1 | LOCAL_EXEC (Mayor) | **RENAME** to 'Mayor of Long Beach' |

Both share `slug='long-beach-city-council'` (slug is GENERATED — rename triggers auto-update).

### Districts (10 rows at geo_id='0643000', state='CA')

| district_type | Count | Label | Action |
|---------------|-------|-------|--------|
| LOCAL | 9 | All labeled 'At-Large' | One district (id `ef56be18`) has no office — use for D8 Thrash-Ntuk |
| LOCAL_EXEC | 1 | 'Long Beach Mayor' | Keep as-is (correct) |

Note: District labels are 'At-Large' (the v7.0 seed pattern). The flat-district model (D-06) means we do NOT rename them to 'District N' — district numbers are encoded in office titles.

### Existing Politicians + Office Links

| external_id | Full Name | office_id (politicians col) | Actual Office Title | Notes |
|------------|-----------|--------------------------|---------------------|-------|
| -200813 | Rex Richardson | **NULL** | Mayor (LOCAL_EXEC) | Back-fill needed (D-10) |
| 665830 | Mary Zendejas | d2aed8fa | Councilmember | D1 |
| 665831 | Cindy Allen | 86d58f6b | Councilmember | D2 — 2 image rows (dedupe) |
| 665833 | Kristina Duggan | 907083c7 | Councilmember | D3 |
| 665834 | Daryl Supernaw | 05ab2f7f | Councilmember | D4 |
| 665835 | Megan Kerr | 8056a370 | Councilmember | D5 — 2 image rows (dedupe) |
| 665838 | Suely Saro | bfad81d3 | Councilmember | D6 |
| 665839 | Roberto Uranga | 25554450 | Councilmember | D7 — 2 image rows (dedupe) |
| 665842 | Joni Ricks-Oddie | 9061b93f | Councilmember | D9 |

### Headshot Status
- **9/9 existing officials have ≥1 image** in `politician_images`
- Duplicates (2 rows each): Cindy Allen (665831), Megan Kerr (665835), Roberto Uranga (665839)
- All use `type='default'`; license values are `press_use` or `scraped_no_license`
- Dedupe rule: keep the row with `photo_license='press_use'` if present; else keep either (both point to same URL); DELETE the extra row

### Stances
- **0 stances for all 9 existing officials** — confirmed via `COUNT(*) = 0` query on `inform.politician_answers`
- Reserved external_id range `-700050…-700099`: **all 50 slots empty** — confirmed

---

## KEY RESEARCH QUESTION 1: Current Officeholders [VERIFIED: longbeach.gov/officials]

All 12 officials verified directly from `https://www.longbeach.gov/officials/` (the authoritative city source) on 2026-06-19.

### Mayor
- **Rex Richardson** — already in DB (external_id -200813)

### City Council (9 districts)

| District | Councilmember | DB Status | Notes |
|----------|--------------|-----------|-------|
| D1 | Mary Zendejas | ✅ in DB (665830) | — |
| D2 | Cindy Allen | ✅ in DB (665831) | — |
| D3 | Kristina Duggan | ✅ in DB (665833) | — |
| D4 | Daryl Supernaw | ✅ in DB (665834) | — |
| D5 | Megan Kerr | ✅ in DB (665835) | — |
| D6 | Suely Saro | ✅ in DB (665838) | — |
| D7 | Roberto Uranga | ✅ in DB (665839) | — |
| **D8** | **Tunua Thrash-Ntuk** | **MISSING — must seat** | Elected March 2024, sworn Dec 17 2024 |
| D9 | Dr. Joni Ricks-Oddie | ✅ in DB (665842) | — |

Migration 294 comment labeled Ricks-Oddie as "(D8/D9)" — she is actually D9; D8 was unfilled at time of migration 294 and is now held by Thrash-Ntuk.

### Citywide Elected Officials (NOT yet in DB)

| Office | Officeholder | Elected | Term ends |
|--------|-------------|---------|-----------|
| City Attorney | **Dawn McIntosh** | June 7, 2022 | Dec 15, 2026 |
| City Prosecutor | **Doug Haubert** | June 7, 2022 (re-elected) | Dec 15, 2026 |
| City Auditor | **Laura L. Doud** | In office since 2006 | Dec 15, 2026 |

All three confirmed at `https://www.longbeach.gov/officials/other-elected-officials/` as "City-Wide Elected Officials" (distinct from appointed City Manager Tom Modica and City Clerk Monique DeLaGarza). [VERIFIED: longbeach.gov/officials/other-elected-officials]

---

## KEY RESEARCH QUESTION 2: Form of Government [VERIFIED: longbeach.gov + charter history]

Long Beach is a **charter city** with a **directly-elected Mayor** (since 1988 charter amendment) and an **appointed City Manager** (Tom Modica). This is sometimes called a "hybrid" — the Mayor is separately elected with veto power over the Council, but a City Manager handles day-to-day operations. [ASSUMED: "council-manager" vs "strong mayor" label — exact charter classification varies by source]

**For DB modeling purposes (following D-01 locked pattern):**
- Mayor Rex Richardson: `district_type=LOCAL_EXEC`, `is_appointed_position=false` — **already correctly modeled in DB**
- City Manager Tom Modica: not in scope (appointed, not elected)
- City Clerk Monique DeLaGarza: not in scope (appointed per longbeach.gov)

**Election method:** Plurality with runoffs (NOT RCV). Long Beach's 2026 elections include a June 2 primary and potential November runoffs. [VERIFIED: longbeach.gov election pages]

**9 council districts:** By-district, single-member, four-year staggered terms. [VERIFIED: longbeach.gov]

**Citywide elected offices (CONFIRMED separately elected):**

The City Attorney, City Prosecutor, and City Auditor are all **elected citywide for four-year terms** under the Long Beach City Charter. Confirmed directly from `https://www.longbeach.gov/officials/other-elected-officials/` which lists them as "City-Wide Elected Officials." [VERIFIED: longbeach.gov/officials/other-elected-officials]

The City Prosecutor is an unusual elected office distinct from the City Attorney. Both exist as separately-elected citywide positions. The City Prosecutor enforces municipal codes and prosecutes misdemeanor criminal activities in Long Beach. [VERIFIED: longbeach.gov/officials/other-elected-officials — both listed as separate entries]

---

## KEY RESEARCH QUESTION 3: Headshot Sources [VERIFIED: longbeach.gov]

### CMS Pattern for longbeach.gov

Long Beach uses a **direct globalassets CDN** (NOT AEM/CQ5 CSS background-image like Sacramento). Photos are accessible via standard img tags at predictable relative URLs.

**Standard pattern (officials page):**
```
https://www.longbeach.gov/globalassets/officials/media-library/images/{lastname}185x200.jpg
```

**Confirmed URL examples (DB-verified from officials page):**
- Mayor: `mayorrichardson185x200.jpg`
- D1 Zendejas: `zendejas185x200.jpg`
- D2 Allen: `allen185x200.jpg`
- D8 Thrash-Ntuk: `tunua185x200.jpg` ← uses first name, not last name
- D9 Ricks-Oddie: `ricks-oddie185x200.jpg`

**Citywide officers (separate department pages):**
- City Attorney McIntosh: `/globalassets/city-attorney/media-library/images/dawnmcintosh_06-20-23_003.jpg`
- City Prosecutor Haubert: `/globalassets/officials/media-library/images/haubert185x200.jpg`
- City Auditor Doud: `/globalassets/officials/media-library/images/doud185x200.jpg`

**Source image dimensions:** 185×200 pixels (raw originals — approximate 37:40 ratio, very close to 1:1)
**Processing required:** Crop to 4:5 ratio (e.g., 160×200 or full 185×200 used as-is depending on content), then resize to 600×750 Lanczos q90 JPEG

**Extraction method:** Standard WebFetch or curl — no special headers required, no WAF blocking observed on globalassets CDN. Direct `https://www.longbeach.gov/globalassets/...` URLs download cleanly.

**Existing 9 officials:** Already have headshots in DB. Verify quality and dedupe (see above) — no re-upload needed for the existing 9 unless image quality is clearly degraded.

**New officials needing headshots:**
1. D8 Tunua Thrash-Ntuk → `https://www.longbeach.gov/globalassets/officials/media-library/images/tunua185x200.jpg`
2. City Attorney Dawn McIntosh → `https://www.longbeach.gov/globalassets/city-attorney/media-library/images/dawnmcintosh_06-20-23_003.jpg`
3. City Prosecutor Doug Haubert → `https://www.longbeach.gov/globalassets/officials/media-library/images/haubert185x200.jpg`
4. City Auditor Laura Doud → `https://www.longbeach.gov/globalassets/officials/media-library/images/doud185x200.jpg`

---

## KEY RESEARCH QUESTION 4: Migration Plan Shape [VERIFIED: DB query + pattern migrations]

### Next migration: 878 [VERIFIED: STATE.md + on-disk counter]

Stance migrations do NOT register in `supabase_migrations.schema_migrations`. On-disk counter is authoritative.

### Recommended Migration Sequence

#### Migration 878 — Data Hygiene / Reconcile
Applied via `schema_migrations` ledger (structural change):
1. `UPDATE essentials.governments SET geo_id='0643000' WHERE id='5e5c3e0b-5479-4759-ac7e-2ea0aecabd38'` (D-07)
2. `UPDATE essentials.chambers SET name='Mayor of Long Beach', name_formal='Mayor of Long Beach' WHERE id='867f4e3f-2be9-4d55-955d-796a3e5bc0a8'` (D-08) — slug auto-regenerates
3. Dedupe images: DELETE the lower-priority duplicate row for Allen (665831), Kerr (665835), Uranga (665839) (D-09)
4. Back-fill Rex Richardson `politicians.office_id = '06c1def0-1f1b-4b9a-97a3-dc2903083edc'` (D-10)
5. Run split-section check SQL after rename (should return 0 rows)

#### Migration 879 — Seat D8 + Add 3 Citywide Officers
Applied via `schema_migrations` ledger (new people + new chambers):

**Part A: Seat D8 Tunua Thrash-Ntuk**
- Use the existing empty LOCAL district `ef56be18-e3f9-482e-a28b-d6a3f9dd3b51` (geo_id=0643000, label='At-Large')
- INSERT politician (external_id **-700050**, reserved range first slot)
- INSERT office into chamber `2109e716` (8-office council chamber), title='Councilmember', district_id=`ef56be18`
- Back-fill `politicians.office_id` for Thrash-Ntuk immediately

**Part B: Add Citywide Officers (3 new chambers + 3 offices + 3 politicians)**

Each citywide officer needs:
1. A new chamber (one per officer, or one shared "Citywide Elected Officials" chamber — see Architecture Patterns section)
2. One LOCAL_EXEC or CITYWIDE district (reuse `geo_id='0643000'` + `district_type='LOCAL_EXEC'` — one already exists for Mayor; need 3 more or reuse the same one)
3. One office row
4. One politician row

Recommended chamber names (distinct, descriptive):
- `'City Attorney of Long Beach'` (name_formal same)
- `'City Prosecutor of Long Beach'` (name_formal same)
- `'City Auditor of Long Beach'` (name_formal same)

Each gets its own chamber per the CA pattern (SF uses separate chambers for City Attorney, DA, etc.). One LOCAL_EXEC district per citywide office (sharing `geo_id='0643000'` is fine — same flat-district pattern already used for Mayor).

External IDs (use reserved range, sequentially after Thrash-Ntuk):
- Thrash-Ntuk D8: **-700050**
- City Attorney McIntosh: **-700051**
- City Prosecutor Haubert: **-700052**
- City Auditor Doud: **-700053**

Note: McIntosh, Haubert, Doud are all `is_appointed=false`, `is_appointed_position=false` (all elected by voters).

#### Migration 880 — Headshots for New Officials
Applied via raw SQL (audit-only pattern, NOT in `schema_migrations` ledger — same as migrations 200/209/212):

Four `politician_images` INSERTs (`type='default'`) for the 4 new officials (Thrash-Ntuk + 3 citywide), plus `photo_origin_url` UPDATE on politician rows. Photo processing: download 185×200 from globalassets CDN, crop/resize to 600×750, upload to `politician_photos` bucket as `{politician_uuid}-headshot.jpg`, `photo_license='press_use'`.

#### Migrations 881+ — Evidence-Only Stance Migrations
Applied via raw SQL, one agent per official, **NOT registered in schema_migrations**. 12 officials × ~6–15 stances each = ~72–180 rows estimated. Run sequentially per D-05.

Stance migration naming convention: `881_{name}_stances.sql` through `892_{name}_stances.sql` (one file per official, sequential). Files exist on disk for audit trail — not applied via ledger.

**Total numbered migrations consuming ledger sequence:** 878, 879 (structural). Migration 880 is audit-only (headshots). 881+ are stance-only (no ledger).

---

## KEY RESEARCH QUESTION 5: Compass Stance Scope [VERIFIED: migration 216 topic list + memory]

### Live Topic IDs (use ONLY these)

From `216_sf_officials_stances.sql` (authoritative reference) cross-checked against `project_compass_live_topic_ids.md` memory:

| Topic Slug | Topic UUID |
|-----------|------------|
| abortion | af2fdfd6-02c4-49df-b09c-cf8536f4773f |
| ai-regulation | 666bf03d-81fc-4138-ab15-69ae734c9023 |
| campaign-finance | 92730f69-ae57-401c-8ad1-2d07834a895d |
| childcare | c1ac1330-47f7-44ec-baf3-c913d926b97c |
| city-sanitation | 7687de4f-4d0b-462a-b803-bdfb23b16b42 |
| civil-rights | 0bc588c6-39e1-4084-b5de-cac909b8b762 |
| climate-change | f1e44d66-5d27-4b51-b54f-b7ace86f6a3c |
| deportation | 44905f3b-e105-4f6c-afc7-5d223813dbac |
| economic-development | eb3d1247-0de1-4b7f-baec-7259861efd53 |
| fossil-fuels | a22215c3-6693-4bc2-b248-01aebba14570 |
| growth-and-development | fb25c1ac-91cc-49bf-8afc-c7fa22ef45e4 |
| healthcare | e8dad4a8-eb93-4931-91f5-d8fb5d7dd529 ← USE THIS (not `be60844f`) |
| homelessness | 4938766b-b45a-46e3-93bd-b8b30651271a |
| homelessness-response | 6fbf39ae-6b19-4182-b4c2-6a8d25c86c0f |
| housing | 669cac97-66a6-4087-b036-936fbe62efb3 ← USE THIS (not `a9f53bc4`) |
| immigration | 4e2c69ce-591e-4197-9cd5-7aceff79d390 ← USE THIS (not `c6957429`) |
| jail-capacity | c267e137-0ff9-4e7d-9d13-e3cea1756cd0 |
| local-environment | 1935979c-b290-42e4-baa5-8cb0138b4ffa |
| local-immigration | b9ccee94-ad96-4f10-b655-889d8e5abe92 |
| medicare/aid | cab61e8a-64fe-4bbd-bc08-fe9914d0091b |
| misinformation | ddd65d64-9dc7-4208-a30f-59f4b9c0653d |
| public-safety-approach | e9ebefcd-c496-45e8-b816-a79f8442ba85 |
| redistricting | 48cc9585-ec22-4f53-8d42-6839828dd36f |
| religious-freedom | 6b9ba6d9-1001-43f5-b073-4d37130696fd |
| rent-regulation | c308e8e8-caac-44f5-ab04-dbfecf40bbe2 |
| residential-zoning | d4f18138-a2e0-4110-b925-7387d9d0d16d |
| same-sex-marriage | c5ab4eab-702f-49b8-9277-8ea53f3835c6 |
| school-vouchers | 00b95a6a-75db-4521-b523-3326bba938de |
| social-security | 87d20824-a6e9-407b-983c-65440084a0ab |
| tariffs | 683c8084-2281-4920-a07c-18439b2dd413 |
| taxes | f7e5678d-dadd-4556-a2fc-446e24642ceb ← USE THIS (not `45ca4740`) |
| trans-athletes | d1618b9c-0b9e-45af-b986-bb33d270b8e4 |
| transportation-priorities | ba59337e-30e2-4aba-a39a-426b3366eb27 |
| ukraine-support | 24e9212c-b011-422a-865c-093e35050901 |
| voting-rights | d1792200-1d3b-4955-a0b7-0e6980d7a7b2 |

**Retired IDs — NEVER use:** `a9f53bc4` (housing old), `45ca4740` (taxes old), `f2a62698` (AI old), `83eeb217` (deportation old), `be60844f` (healthcare old), `c6957429` (immigration old). [VERIFIED: project_compass_live_topic_ids.md memory + migration 216]

**Judicial topics** (for City Attorney and City Prosecutor):

| Topic Slug | Topic UUID |
|-----------|------------|
| judicial-access-to-justice | 9d45acaf-1ba4-4cb8-95e1-5ed985223b91 |
| judicial-bail-pretrial | 1fab5edf-6151-4da0-9704-a7f2113ba54c |
| judicial-criminal-justice | 9db07b16-1076-4b7d-ad89-ebe7b51f4336 |
| judicial-government-deference | e5e48f0e-8f3a-40e1-8080-889fea389603 |
| judicial-interpretation | 448b1c9a-b6f3-42b8-8f39-d3bbb5bfa9ee |
| judicial-police-accountability | 7bad33eb-e93e-4d94-8822-97212d49bde5 |
| judicial-prosecution-priorities | abb99d95-cbb1-4617-8f8b-f220ef6028ca |
| judicial-transparency | 6674d87e-999d-433a-aab7-3f626f59fd5f |

These judicial topics apply to City Attorney + City Prosecutor (per `project_judicial_compass_design.md` memory). The `judicial-transparency` topic has a known "not-found" pattern per `project_la_candidate_stance_complete.md` memory — agent should leave blank if no evidence found rather than default. [VERIFIED: migration 216 topic list]

### Stance Research Protocol (ALL 12 officials)

1. Evidence-only — blank spoke is correct where no public record exists (D-05)
2. One research agent at a time — never parallel (rate-limit rule per project memory)
3. All live compass topics — aim for 18–21+ placements per official where record exists
4. No default values — never place at neutral/moderate without evidence
5. ON CONFLICT (politician_id, topic_id) DO UPDATE — idempotent apply
6. Apply path: `mcp__supabase-local execute_sql` from main agent context (confirmed working, writes to production) OR `psql -f` via `C:/EV-Accounts/backend/.env` DATABASE_URL
7. Stance migrations do NOT register in `schema_migrations`

**Scope: 12 officials in this order (reconciled 9 existing + 3 new citywide + D8):**
1. Rex Richardson (Mayor) — existing, 0 stances
2. Mary Zendejas (D1) — existing, 0 stances
3. Cindy Allen (D2) — existing, 0 stances
4. Kristina Duggan (D3) — existing, 0 stances
5. Daryl Supernaw (D4) — existing, 0 stances
6. Megan Kerr (D5) — existing, 0 stances
7. Suely Saro (D6) — existing, 0 stances
8. Roberto Uranga (D7) — existing, 0 stances
9. Dr. Joni Ricks-Oddie (D9) — existing, 0 stances
10. Tunua Thrash-Ntuk (D8) — new (seated Dec 2024; may have thin record)
11. Dawn McIntosh (City Attorney) — new; judicial topics apply
12. Doug Haubert (City Prosecutor) — new; judicial topics apply
13. Laura L. Doud (City Auditor) — new

---

## Standard Stack

### Core (all CA city deep-seed phases)

| Library/Pattern | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| PostgreSQL / psql | 18.1 (local) | Run migrations | On-disk migration pattern for LB |
| mcp__supabase-local | — | Execute SQL from main agent | Writes directly to production; confirmed working for stance migrations |
| Supabase Storage | — | Headshot upload | `politician_photos` bucket; `{uuid}-headshot.jpg` path |
| Python Pillow (PIL) | [ASSUMED] | Crop 4:5 + resize 600×750 Lanczos | Standard image processing pattern |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mcp__supabase-local | psql -f via .env DATABASE_URL | Subagent executors may lack MCP; psql is portable fallback |
| Python Pillow | Any image editor | Pillow is scriptable; manual crop acceptable if tool unavailable |

---

## Architecture Patterns

### System Architecture Diagram

```
Data flow for Phase 142:

[longbeach.gov/officials]  →  Research Agent  →  Roster verification
[longbeach.gov/globalassets] →  Download 185×200 JPEG  →  Crop 4:5  →  Resize 600×750
                                                          ↓
                                               Supabase Storage (politician_photos)
                                                          ↓
                                           INSERT politician_images (type='default')

[Research Agent]  →  Evidence-only stance values  →  INSERT inform.politician_answers
                                                    →  INSERT inform.politician_context

[psql / mcp__supabase-local]
  →  Migration 878: UPDATE gov geo_id, RENAME chamber, DELETE dupes, UPDATE office_id
  →  Migration 879: INSERT Thrash-Ntuk + 3 chambers + 3 officers
  →  Migration 880: INSERT politician_images (audit-only, no ledger)
  →  Migrations 881+: INSERT stances (no ledger, sequential)
```

### Recommended Project Structure for Migrations

```
C:/EV-Accounts/backend/migrations/
├── 878_long_beach_reconcile.sql         # Data hygiene (ledger)
├── 879_long_beach_complete.sql          # New officials (ledger)
├── 880_long_beach_headshots.sql         # Headshots (audit-only)
├── 881_rex_richardson_stances.sql       # Mayor (no ledger)
├── 882_mary_zendejas_stances.sql        # D1 (no ledger)
├── 883_cindy_allen_stances.sql          # D2 (no ledger)
├── 884_kristina_duggan_stances.sql      # D3 (no ledger)
├── 885_daryl_supernaw_stances.sql       # D4 (no ledger)
├── 886_megan_kerr_stances.sql           # D5 (no ledger)
├── 887_suely_saro_stances.sql           # D6 (no ledger)
├── 888_roberto_uranga_stances.sql       # D7 (no ledger)
├── 889_joni_ricks_oddie_stances.sql     # D9 (no ledger)
├── 890_tunua_thrash_ntuk_stances.sql    # D8 (no ledger)
├── 891_dawn_mcintosh_stances.sql        # City Attorney (no ledger)
├── 892_doug_haubert_stances.sql         # City Prosecutor (no ledger)
└── 893_laura_doud_stances.sql           # City Auditor (no ledger)
```

### Pattern 1: WHERE NOT EXISTS Guard on Governments / Districts

Used throughout CA city migrations (219, 220). [VERIFIED: migration 219_sacramento_government_structure.sql]

```sql
-- Source: migration 219_sacramento_government_structure.sql
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0643000', 'LOCAL_EXEC', 'Long Beach (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0643000' AND state = 'CA' AND district_type = 'LOCAL_EXEC'
    AND id != '00ae658f-3490-49c6-970a-ccb9c90c4a78'  -- not the existing Mayor district
);
-- NOTE: For Long Beach, one LOCAL_EXEC already exists (for Mayor).
-- New citywide officers need additional LOCAL_EXEC district rows.
```

### Pattern 2: Politician + Office INSERT (Sacramento Pattern)

```sql
-- Source: migration 220_sacramento_officials.sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Tunua Thrash-Ntuk', 'Tunua', 'Thrash-Ntuk', NULL,
          true, false, false, true, -700050)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       'ef56be18-e3f9-482e-a28b-d6a3f9dd3b51',  -- existing empty D8 LOCAL district
       '2109e716-127f-4d0d-8ec5-7bf77d503e03',  -- 8-office council chamber
       p.id,
       'Councilmember', 'CA', false, false, NULL
FROM ins_p p
WHERE p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = 'ef56be18-e3f9-482e-a28b-d6a3f9dd3b51'
      AND o.politician_id = p.id
  );
```

### Pattern 3: Stance INSERT (SF Pattern)

```sql
-- Source: migration 216_sf_officials_stances.sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{uuid}', '{topic_uuid}', 3.0)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{uuid}', '{topic_uuid}',
        $$Plain-language reasoning with citation...$$,
        ARRAY['https://source1.com', 'https://source2.com']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

### Pattern 4: Chamber Rename (UNIQUE to reconcile phase)

```sql
-- Rename Mayor's duplicate-named chamber (no precedent migration — simple UPDATE)
UPDATE essentials.chambers
SET name = 'Mayor of Long Beach',
    name_formal = 'Mayor of Long Beach'
WHERE id = '867f4e3f-2be9-4d55-955d-796a3e5bc0a8';
-- slug is GENERATED — auto-recomputes from new name
```

### Pattern 5: Headshot INSERT (Fremont Pattern)

```sql
-- Source: migration 212_fremont_headshots.sql (audit-only pattern)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -700050),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -700050)
);

UPDATE essentials.politicians
SET photo_origin_url = 'https://www.longbeach.gov/officials/'
WHERE external_id = -700050 AND photo_origin_url IS NULL;
```

### Anti-Patterns to Avoid

- **ON CONFLICT (geo_id) on governments:** No unique constraint on `geo_id` — fails at runtime. Use WHERE NOT EXISTS.
- **Including `slug` in chamber INSERT:** `slug` is a GENERATED column — including it in INSERT throws error.
- **Parallel stance research agents:** Rate-limit burn with no usable output. Always one at a time.
- **Stance migrations registered in schema_migrations:** They do not register — on-disk counter is authoritative.
- **Using retired topic IDs:** Six IDs are is_live=false (see above). Using them violates integrity rules.
- **Creating per-district geofences:** D-06 locks the flat-district pattern. All council offices share geo_id=0643000.
- **INSERT new government row:** Government already exists — UPDATE only, never re-INSERT.
- **Inserting Clerk or Manager stances:** City Clerk (Monique DeLaGarza) and City Manager (Tom Modica) are appointed; not in scope.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent SQL guards | TRUNCATE + full re-insert | WHERE NOT EXISTS pattern | Existing politicians/offices have FK dependencies |
| Stance topic ID lookup | In-memory dict | Use UUIDs from this doc / migration 216 | Six retired IDs could silently corrupt data |
| Image cropping | Manual Photoshop | Python Pillow + Lanczos | Consistent 600×750 4:5 ratio requirement |
| Headshot downloads | Playwright/browser automation | Direct curl / WebFetch on globalassets CDN | LB globalassets CDN is directly accessible (no WAF) |
| Chamber slug management | Manual slug value | Omit from INSERT — GENERATED column handles it | Including slug throws PostgreSQL error |

**Key insight:** Long Beach's data-hygiene issues (duplicate chamber names, NULL geo_id, duplicate images) are all fixable with targeted SQL UPDATEs and DELETEs. No wholesale re-seeding is needed or safe.

---

## Common Pitfalls

### Pitfall 1: Mayor Chamber Rename May Silently Not Apply
**What goes wrong:** Planner writes `WHERE name = 'Long Beach City Council'` — matches BOTH chambers; rename applies to the wrong one or both.
**Why it happens:** Two chambers share the exact same name. Name-only WHERE clause is ambiguous.
**How to avoid:** Always use `WHERE id = '867f4e3f-2be9-4d55-955d-796a3e5bc0a8'` (the known UUID of the Mayor's chamber). Never use `WHERE name = ...` for this UPDATE.
**Warning signs:** After migration, `SELECT COUNT(*) FROM essentials.chambers WHERE name='Long Beach City Council' AND government_id='5e5c3e0b...'` should return exactly 1 (not 0, not 2).

### Pitfall 2: District Label Still Shows 'At-Large' After Council Add
**What goes wrong:** New D8 office is created in the empty LOCAL district (id `ef56be18`) but label stays 'At-Large' — confusing to display.
**Why it happens:** D-06 says keep flat-district pattern (don't create per-district geofences) but doesn't specify the label behavior.
**How to avoid:** Long Beach is by-district (not truly at-large). Add office title 'Councilmember' — the district label ('At-Large') is an artifact of the original v7.0 seed pattern. No label rename needed per D-06, but confirm office title = 'Councilmember' (matching existing 8 offices). The district number is NOT currently encoded in district labels for LB (unlike Sacramento which uses 'District N').
**Warning signs:** After migration, query office title for D8 — should be 'Councilmember', not 'Council Member (District 8)' (use existing LB convention, not Sacramento convention).

### Pitfall 3: External ID Range Collision
**What goes wrong:** Picking an external_id already used by another CA politician.
**Why it happens:** Multiple CA external_id ranges occupied (see LOCATION-ONBOARDING.md CA Quick Reference).
**How to avoid:** The -700050…-700099 range is DB-verified empty as of 2026-06-19. Always run pre-flight before any CA external_id assignment: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -700099 AND -700050`.
**Warning signs:** `ON CONFLICT (external_id) DO NOTHING` silently skips an INSERT — check RETURNING clause.

### Pitfall 4: Stance Migration Counted in Ledger
**What goes wrong:** Running stance migrations through the normal ledger path increments `schema_migrations.MAX(version)`, breaking the on-disk counter alignment.
**Why it happens:** Prior sessions applied stance migrations via `psql -f` only (not ledger-registered); the convention is documented but easy to forget.
**How to avoid:** Never wrap stance migrations in the standard migration apply command. Apply via `mcp__supabase-local execute_sql` directly or `psql -f` directly. Verify MAX(version) before and after stance migrations = unchanged.
**Warning signs:** After stance migrations, `SELECT MAX(version) FROM supabase_migrations.schema_migrations` should be 879 (not higher).

### Pitfall 5: City Prosecutor Scope Confusion (judicial vs. regular topics)
**What goes wrong:** Researcher treats City Prosecutor the same as a Councilmember and applies only city policy topics — misses judicial topics.
**Why it happens:** City Prosecutor is unusual (most cities don't have this office) — easy to treat as a generic city official.
**How to avoid:** City Prosecutor Doug Haubert gets BOTH standard city topics (where evidence exists) AND judicial topics (judicial-prosecution-priorities, judicial-criminal-justice, judicial-police-accountability, etc.) per the judicial compass design in project memory.
**Warning signs:** Stance file for Haubert has zero judicial-* topic rows despite the office being a legal/prosecutorial role.

### Pitfall 6: Image Dedupe Deletes the Wrong Row
**What goes wrong:** Deleting `politician_images` rows by `politician_id` without specifying WHICH row — deletes both images instead of one.
**Why it happens:** Two rows have identical `politician_id`, `type='default'`, and same `url` — but different `id` and `photo_license` values.
**How to avoid:** Delete by specific `id` (the lower-priority row). Strategy: keep `press_use` license; delete `scraped_no_license` duplicate. If both are same license, keep either and delete by specific UUID. NEVER use `DELETE FROM politician_images WHERE politician_id = ...` without a `LIMIT` or `id` filter — it deletes all rows for that person.
**Warning signs:** After dedupe, `SELECT COUNT(*) FROM politician_images WHERE politician_id = '...'` = 0 means both rows were accidentally deleted.

### Pitfall 7: Split-Section Persists After Chamber Rename
**What goes wrong:** Renaming the Mayor chamber fixes the display_name but the routing query still groups offices into sections by some other key.
**Why it happens:** The split-section check SQL in project memory verifies that government_body sections are correctly separated — if both chambers now have different names, split is resolved.
**How to avoid:** Run the split-section check SQL from `feedback_section_split_check.md` memory after migration 878.
**Warning signs:** Split-section SQL returns any rows after the rename.

---

## Code Examples

### Check Split-Section After Rename
```sql
-- Source: feedback_section_split_check memory pattern
-- Run after migration 878 — should return 0 rows
SELECT g.name AS gov_name, c.name AS chamber_name, COUNT(DISTINCT o.id) AS offices
FROM essentials.governments g
JOIN essentials.chambers c ON c.government_id = g.id
JOIN essentials.offices o ON o.chamber_id = c.id
WHERE g.id = '5e5c3e0b-5479-4759-ac7e-2ea0aecabd38'
GROUP BY g.name, c.name
HAVING COUNT(DISTINCT c.name) > 1
   AND g.id = '5e5c3e0b-5479-4759-ac7e-2ea0aecabd38';
-- Simpler post-rename verification:
SELECT id, name, name_formal FROM essentials.chambers
WHERE government_id = '5e5c3e0b-5479-4759-ac7e-2ea0aecabd38';
-- Should show: 'Mayor of Long Beach' + 'Long Beach City Council' (NOT two 'Long Beach City Council')
```

### Dedupe Images (safe pattern)
```sql
-- Find duplicate rows first — verify before deleting
SELECT politician_id, COUNT(*), array_agg(id) AS image_ids, array_agg(photo_license) AS licenses
FROM essentials.politician_images
WHERE politician_id IN (
  SELECT id FROM essentials.politicians WHERE external_id IN (665831, 665835, 665839)
)
GROUP BY politician_id
HAVING COUNT(*) > 1;

-- Delete the scraped_no_license row (keep press_use) for each affected politician
DELETE FROM essentials.politician_images
WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 665831)
  AND photo_license = 'scraped_no_license'
  AND id = (
    SELECT id FROM essentials.politician_images
    WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 665831)
      AND photo_license = 'scraped_no_license'
    LIMIT 1
  );
-- Repeat for 665835 (Kerr) and 665839 (Uranga)
```

### Pre-flight External ID Check
```sql
-- Run before writing migration 879 — confirm range clear
SELECT external_id, full_name
FROM essentials.politicians
WHERE external_id BETWEEN -700099 AND -700050
ORDER BY external_id;
-- Expected: 0 rows (as of 2026-06-19 DB state)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stance migrations registered in schema_migrations | Apply raw SQL (no ledger entry), on-disk counter authoritative | v15.0 (2026-06-16) | Stance migrations can be replayed without ledger conflicts |
| Uniform `election_method` on all chambers | Per-chamber election_method; Long Beach = '' (plurality with runoffs, not 'rcv') | v7.0 CA seed | Long Beach is NOT RCV; do not set election_method='rcv' |
| AEM/CQ5 curl+grep headshot extraction (Sacramento) | Direct globalassets CDN JPEG (Long Beach) | City-specific | No special extraction needed for LB |

**Deprecated/outdated:**
- Migration 294's label of "Joni Ricks-Oddie (D8/D9)": She is D9. D8 is now Tunua Thrash-Ntuk (sworn Dec 17, 2024).
- Government `geo_id=NULL`: Must be backfilled to '0643000' (part of migration 878 D-07).
- Duplicate 'Long Beach City Council' chamber names: Resolved by rename in migration 878 D-08.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Long Beach charter classifies as "council-manager" vs "strong mayor" — classification label | Govt Structure | Low — DB modeling is locked (Mayor=LOCAL_EXEC) per D-01; label doesn't affect schema |
| A2 | Image dedupe keeps `press_use` row, deletes `scraped_no_license` duplicate | Code Examples | Low — both rows have same URL; either is acceptable; just need exactly 1 row per person |
| A3 | Stance migrations number sequentially 881–893 (13 officials) | Migration Plan | Low — exact numbers are cosmetic; on-disk counter is authoritative regardless |
| A4 | Citywide officers each get their own chamber row (vs. one shared "Citywide Elected Officials" chamber) | Architecture Patterns | Medium — if shared chamber is preferred, one less chamber INSERT; doesn't affect routing but may affect display grouping |
| A5 | Python Pillow used for image processing | Standard Stack | Low — any 4:5-crop + 600×750 Lanczos tool is acceptable |

---

## Open Questions (RESOLVED)

> All three resolved by the recommendations below and implemented in the plans:
> Q1 → separate chambers (Plan 142-02); Q2 → relabel districts (Plan 142-01); Q3 → is_incumbent=true, is_vacant=false (Plan 142-02).

1. **Should citywide officers (City Attorney, Prosecutor, Auditor) each get their own chamber row, or share one "Citywide Elected Officials" chamber?**
   - What we know: SF uses separate chambers per major citywide office. Sacramento/Fremont/Compton don't seat these officials at all.
   - What's unclear: A shared chamber would display them as a group; separate chambers display them as separate sections.
   - Recommendation: Separate chambers (one per office) — clearer to the voter; follows SF/Berkeley CA precedent; simpler routing.

2. **Should the existing 8 council LOCAL district labels be updated from 'At-Large' to 'District N'?**
   - What we know: Long Beach is a by-district council (NOT at-large). Current labels 'At-Large' are artifacts of the v7.0 seed pattern. D-06 says keep flat geo_ids.
   - What's unclear: D-06 says keep the flat-district pattern but doesn't address label accuracy.
   - Recommendation: Update labels to 'District 1'…'District 9' in migration 878 for display accuracy. This is a label UPDATE only (no geofence change). Small addition to reconcile migration.

3. **What is the correct `is_vacant` / `is_incumbent` state for Tunua Thrash-Ntuk?**
   - What we know: She was elected March 2024, sworn in December 17, 2024, and is the active current officeholder.
   - Recommendation: `is_incumbent=true`, `is_vacant=false`, `is_appointed=false`. Standard for an active elected official.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Running SQL migrations | ✓ | 18.1 | mcp__supabase-local execute_sql |
| mcp__supabase-local | Stance migration apply (main agent) | ✓ | — | psql -f via .env DATABASE_URL |
| longbeach.gov globalassets CDN | Headshot downloads | ✓ | — | — (no fallback needed; direct access confirmed) |
| Python Pillow | Image crop/resize | [ASSUMED] available | — | Any image editor supporting Lanczos resize |
| Supabase Storage (politician_photos bucket) | Headshot upload | ✓ | — | — |

**Missing dependencies with no fallback:** None identified.

---

## Validation Architecture

> workflow.nyquist_validation not found in .planning/config.json — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | psql smoke queries (no automated test suite for migration phases) |
| Config file | none — inline verification SQL in migration comments |
| Quick run command | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -700099 AND -700050;"` |
| Full suite command | Per-migration verification queries listed in each migration file header |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| LBCH-01 | Government row has geo_id='0643000' | smoke | `SELECT geo_id FROM essentials.governments WHERE id='5e5c3e0b...'` | Wave 0: verify NULL; post-878: verify '0643000' |
| LBCH-01 | No duplicate chamber names | smoke | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='5e5c3e0b...' AND name='Long Beach City Council'` | Should return 1 after migration 878 |
| LBCH-01 | All 12 officials have headshots | smoke | `SELECT p.full_name FROM essentials.politicians p LEFT JOIN essentials.politician_images pi ON pi.politician_id=p.id WHERE pi.id IS NULL AND p.external_id IN (...)` | Wave 3 gate: 0 rows |
| LBCH-01 | All 12 officials have ≥1 stance | smoke | `SELECT COUNT(DISTINCT politician_id) FROM inform.politician_answers WHERE politician_id IN (...)` | Final gate: 12 |
| LBCH-01 | No stale duplicates in politician_images | smoke | `SELECT politician_id, COUNT(*) FROM essentials.politician_images WHERE politician_id IN (...) GROUP BY politician_id HAVING COUNT(*)>1` | Should return 0 rows after dedupe |
| LBCH-01 | Rex Richardson office_id back-filled | smoke | `SELECT office_id FROM essentials.politicians WHERE external_id=-200813` | Should be non-NULL after migration 878 |

### Sampling Rate

- **Per migration:** Verification SQL in migration header comments
- **Per wave merge:** Full smoke check (all 6 queries above)
- **Phase gate:** All 6 smoke queries return expected results before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure (psql inline verification) covers all phase requirements.

---

## Security Domain

> No authentication changes, no new API endpoints, no user data changes. This phase is database seeding only.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Partial | SQL uses parameterized UUIDs (gen_random_uuid()); no user input |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via stance reasoning text | Tampering | Use `$$dollar-quoting$$` for multi-line text literals (SF migration 216 pattern) |
| Accidental production write | Tampering | mcp__supabase-local IS production — confirm writes intentional before execute_sql |

---

## Sources

### Primary (HIGH confidence)
- [VERIFIED: longbeach.gov/officials] — Current roster (Mayor + 9 council + 3 citywide officers) scraped 2026-06-19
- [VERIFIED: longbeach.gov/officials/other-elected-officials] — Confirmed City Attorney/Prosecutor/Auditor as "City-Wide Elected Officials" (separate from appointed Clerk/Manager)
- [VERIFIED: live DB] — psql queries 2026-06-19: government row, chambers, districts, politicians, politician_images, stance count, external_id range
- [VERIFIED: migration 216_sf_officials_stances.sql] — Live compass topic UUIDs
- [VERIFIED: project_compass_live_topic_ids.md memory] — Retired topic IDs to avoid
- [VERIFIED: migration 294_la_wave1_long_beach.sql] — Reserved external_id range -700050…-700099
- [VERIFIED: migration 219_sacramento_government_structure.sql] — WHERE NOT EXISTS guard patterns, GENERATED slug rule
- [VERIFIED: migration 212_fremont_headshots.sql] — Headshot audit-only migration pattern
- [VERIFIED: LOCATION-ONBOARDING.md §California Quick Reference] — CA-specific traps (districts.state='CA' uppercase, no ON CONFLICT on geo_id, chambers.slug GENERATED)

### Secondary (MEDIUM confidence)
- [CITED: lbpost.com/news/politics/tunua-thrash-ntuk-sworn-in] — Thrash-Ntuk election date (March 2024) and swearing-in date (December 17, 2024) — confirmed via news source
- [CITED: longbeach.gov/district8] — D8 Thrash-Ntuk headshot URL pattern confirmed
- [CITED: longbeach.gov/district9/about-us] — Ricks-Oddie D9 headshot URL confirmed
- [CITED: longbeach.gov/attorney/city-attorney/dawn-a--mcintosh] — McIntosh election date June 7, 2022 + headshot URL

### Tertiary (LOW confidence)
- [ASSUMED] Long Beach charter form-of-government classification ("council-manager" vs. "hybrid") — multiple sources disagree; modeling is locked per D-01 regardless

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — psql + mcp__supabase-local + globalassets CDN all verified
- Architecture: HIGH — all UUID values DB-verified; migration patterns from proven prior migrations
- Pitfalls: HIGH — based on actual DB state + known CA city-seed traps
- Roster: HIGH — direct longbeach.gov scrape
- Headshots: HIGH — URL patterns confirmed from multiple district pages
- Stance topics: HIGH — confirmed from migration 216 authoritative list

**Research date:** 2026-06-19
**Valid until:** 2026-08-19 (stable roster; next Long Beach election Nov 2026 — roster may change after Dec 2026 swearing-in)
