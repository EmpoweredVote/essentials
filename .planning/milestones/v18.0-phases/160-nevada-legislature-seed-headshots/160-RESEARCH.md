# Phase 160: Nevada Legislature (seed + headshots) - Research

**Researched:** 2026-06-23
**Domain:** Greenfield two-chamber state-legislature seed (63 members) + official-source headshots, Postgres/Supabase, address-routed offices linked to pre-existing TIGER SLDU/SLDL districts
**Confidence:** HIGH (structural patterns, casing, headshot URLs all verified) / MEDIUM-HIGH (rosters cross-confirmed across two independent sources)

## Summary

This is a **greenfield seed of all 63 Nevada state legislators** (21 Senate / SLDU, 42 Assembly / SLDL), each with a 600×750 headshot, mirroring the proven TX (mig 108/109/110), OR (227/228), and VA (308/319) two-house legislature analogs. Phase 158 already loaded the SLDU/SLDL geofence district rows; this phase creates **2 chambers** under State of Nevada (`geo_id='32'`), **63 politicians**, **63 offices linked to existing districts** (NO new districts), office_id back-fills, and **63 headshots**. Compass stances are explicitly DEFERRED and must be verified ABSENT at phase close.

The single most important output — the **district→name→party roster** — was compiled from the official `leg.state.nv.us` "Current" legislator pages and independently cross-checked against Wikipedia. **All 63 seats agree across both sources.** The official roster page also yielded the **exact headshot URL pattern and per-member numeric image IDs** for all 63 members, which removes the largest execution risk (headshot sourcing) almost entirely. No vacancies were found in either chamber.

**Primary recommendation:** Replicate the OR-house analog (`227_or_state_house.sql`) verbatim for both chambers, substituting NV values: chambers `'Nevada State Senate'` / `'Nevada State Assembly'` under `geo_id='32'`; offices keyed on `d.geo_id` + `d.district_type` + **`d.state='nv'` (lowercase)**; external_ids `senate -3203001..-3203021` and `assembly -3204001..-3204042`; titles `'State Senator'` / `'Assemblymember'`. Source all 63 headshots from the official archive at `https://archive.leg.state.nv.us/Session/84th2027/legislators/{Senators|Assembly}/Images/{Mangled}.{id}.jpg` (full-size, crop-to-4:5 then resize 600×750), with Wikimedia/openstates fallback only if any URL fails.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Primary headshot source is the **official Nevada Legislature site** (`leg.state.nv.us` member pages — government work). Process with **crop-to-4:5 then resize 600×750 Lanczos q90** (official portraits are not guaranteed 4:5, so crop-first like the Controller in 159, NOT resize-only).
- **D-02:** Fallback order when the official photo is missing/unusable: **Wikipedia/Wikimedia Commons → Open States (openstates.org)**. Record the chosen source + license per member (e.g., `us_government_work`/`public_domain`/`cc_by_sa_*`).
- **D-03:** **No fabricated photos (SC#3).** Any legislator with no findable authoritative portrait is left without a headshot and **documented as a genuine gap** in the SUMMARY; the seed/office row is still created.
- **D-04:** Voter-facing titles are **"State Senator"** and **"Assemblymember"** (Nevada's official gender-neutral term, one word).
- **D-06:** Seed the **current sitting membership as of June 2026** (post-2025 regular session, including any mid-term appointments/replacements).
- **D-07:** Any genuinely **vacant seat** is seeded as the district/office with **`is_vacant=true` and no invented person** — never fabricate a member to fill a seat.

### Claude's Discretion
- **D-05:** Seed **uniform base titles** for all members. Add leadership (e.g., Senate Majority Leader, Speaker of the Assembly) into the title **only if trivially available** during roster research; otherwise leadership is deferred — do not block the seed on it. *(See "Leadership availability" below — leadership IS trivially available and documented for optional inclusion.)*
- Chamber modeling: 2 chambers ("Senate" + "Assembly", with formal names) under State of Nevada (`geo_id='32'`), mirroring TX/OR/VA analogs. `slug` is GENERATED ALWAYS — never in the INSERT column list.
- **external_id scheme:** pick a distinct NV-legislator range that does NOT collide (House -32001..-32004; STATE_EXEC -3200001..-3200006). Propose senate -3203xxx / assembly -3204xxx; confirm free during research.
- Office linkage: link offices to the **existing** SLDU/SLDL district rows (state='nv' lowercase). Do NOT create new districts.
- Migration sequencing: structural seed migration(s) starting at **1053** (registered); headshot rows as audit-only (unregistered). Idempotent (WHERE NOT EXISTS / ON CONFLICT external_id DO NOTHING).
- Headshot scripts are gitignored `backend/scripts/_tmp-*` helpers run inline by the orchestrator (gsd-executor has no Supabase MCP — DB applies + Storage uploads + audits are inline-orchestrator steps).

### Deferred Ideas (OUT OF SCOPE)
- **Compass stances for all 63 legislators** — explicitly deferred to a follow-up milestone (SC#4). Must be verified ABSENT at phase close.
- **Leadership role modeling** — only if not trivially available (D-05).
- **2026 election rows** for legislative seats — phase 167 (NV-ELEC-01).
- No new geofences (158 owns SLDU/SLDL).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NV-LEG-01 | 21 NV State Senators seeded; offices linked to SLDU districts; 600×750 headshots; stances deferred | Verified 21-member roster (district→name→party) below; Senate chamber pattern from `108_tx_state_legislature_chambers.sql`; office-link pattern from `227_or_state_house.sql` (STATE_UPPER); headshot URLs verified for all 21 |
| NV-LEG-02 | 42 NV Assembly members seeded; offices linked to SLDL districts; 600×750 headshots; stances deferred | Verified 42-member roster below; Assembly chamber pattern; office-link pattern (STATE_LOWER); headshot URLs verified for all 42 |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Address → State Senator / Assemblymember routing | Database / Storage (TIGER geofence + offices→districts) | API (`/representatives/me`) | SLDU/SLDL geofences (158) + offices join resolve who-represents-you; backend reads it |
| Chamber + office + politician seed | Database (migration) | — | Pure CRUD migration under `essentials` schema |
| Headshot acquisition + resize | Utility script (Python, inline orchestrator) | CDN / Storage (Supabase `politician_photos`) | Download→crop→resize→upload pipeline; CDN serves 600×750 JPEG |
| Headshot DB linkage | Database (audit-only `politician_images` INSERT) | — | Row points to CDN URL |
| Voter-facing title display | Frontend (existing groupHierarchy/profile UI) | — | No new UI; titles `State Senator`/`Assemblymember` render via existing components |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | live prod | Seed chambers/politicians/offices/images | Project canonical store (`essentials` schema) `[VERIFIED: 159-PATTERNS]` |
| Python 3 + Pillow (PIL) | repo `_tmp-*` scripts | Download → crop 4:5 → resize 600×750 Lanczos q90 | Exact pipeline used by every prior headshot phase `[VERIFIED: _tmp-va-delegates-headshots.py]` |
| requests | — | HTTP download + Supabase Storage PUT (`x-upsert`) | Same as VA/OR/NV-159 scripts `[VERIFIED]` |
| psycopg2 | — | Runtime `external_id → politician UUID` lookup inside the script | VA delegate script resolves UUIDs at runtime from `.env DATABASE_URL` `[VERIFIED: _tmp-va-delegates-headshots.py lines 216-225]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Storage REST | — | `PUT /storage/v1/object/politician_photos/{uuid}-headshot.jpg` | Upload step, `x-upsert: true` |

**No new packages installed.** All tooling already exists in `C:/EV-Accounts/backend/scripts/`. **Package Legitimacy Audit is N/A** (no external package installs this phase).

**Installation:** None.

## Architecture Patterns

### System Architecture Diagram

```
                 leg.state.nv.us "Current" roster pages          Wikipedia (cross-check)
                 (Senate + Assembly)                              Nevada_Senate / Nevada_Assembly
                          |                                              |
                          v                                              v
              [ Roster: district -> name -> party -> image-id ]  (63 rows, both sources agree)
                          |
        ┌─────────────────┴───────────────────────────┐
        v                                               v
 STRUCTURAL MIGRATION 1053 (registered)          HEADSHOT SCRIPT (_tmp-*, inline)
   - 2 chambers under geo_id='32'                   for each of 63 ext_ids:
   - 63 politicians (ON CONFLICT ext_id)              resolve UUID (psycopg2 from DB)
   - 63 offices -> EXISTING SLDU/SLDL districts       download archive full-size .jpg
       keyed (geo_id, district_type, state='nv')      crop 4:5 -> resize 600x750 q90
   - office_id back-fill                               PUT Storage politician_photos/{uuid}-headshot.jpg
        |                                                   |
        v                                                   v
   apply_migration (inline orchestrator)            AUDIT MIGRATION(S) 1054 (NOT registered)
        |                                              politician_images INSERT (id,politician_id,url,type,photo_license)
        └──────────────────────┬─────────────────────────┘
                               v
            VERIFICATION (inline): 21 SLDU routed, 42 SLDL routed,
            63 headshots CDN-200, 0 stances, 0 section-split, casing correct
                               |
                               v
        Any NV address -> /representatives/me -> correct State Senator + Assemblymember (with photo)
```

### Recommended Migration Structure
```
C:/EV-Accounts/backend/migrations/
├── 1053_nv_legislature.sql          # STRUCTURAL, registered: 2 chambers + 63 politicians + 63 offices + back-fill
├── 1054_nv_legislature_headshots.sql # AUDIT-ONLY, NOT registered: 63 politician_images rows
C:/EV-Accounts/backend/scripts/
└── _tmp-nv-legislature-headshots.py # gitignored, run inline; resolves UUIDs at runtime, manifest output
```
*The planner may split the structural migration into 1053 (Senate) + 1054 (Assembly) if it prefers smaller files; renumber headshots accordingly. A single combined 1053 is simplest and matches the single-state-tier precedent.*

### Pattern 1: Chamber INSERT (idempotent, slug excluded)
**What:** Create the two legislature chambers under State of Nevada.
**Source:** `C:/EV-Accounts/backend/migrations/108_tx_state_legislature_chambers.sql` (exact analog).
```sql
-- Source: 108_tx_state_legislature_chambers.sql lines 22-42, NV-substituted
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Nevada State Senate',
       'Nevada State Senate',
       (SELECT id FROM essentials.governments WHERE geo_id = '32')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Nevada State Senate'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);
-- repeat for 'Nevada Assembly' / 'Nevada State Assembly'
-- CRITICAL: never include 'slug' (GENERATED ALWAYS). name_formal must NOT be '' (breaks profile render — mig 107 lesson).
```
**Naming note:** Use `name='Nevada State Senate'` (formal `'Nevada State Senate'`) and `name='Nevada Assembly'` (formal `'Nevada State Assembly'`). The voter-facing *office titles* are `State Senator`/`Assemblymember` (D-04) — distinct from chamber names. `[CITED: 108_tx_state_legislature_chambers.sql]`

### Pattern 2: Politician + Office CTE, linked to EXISTING district (single-member)
**What:** Insert each legislator and link an office to the pre-existing SLDU/SLDL district. NO district INSERT.
**Source:** `227_or_state_house.sql` lines 16-45 (OR house — closest analog: greenfield, uses existing TIGER districts, lowercase state).
```sql
-- Source: 227_or_state_house.sql, NV-substituted. SD-5 Carrie Ann Buck example.
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Carrie Ann Buck', 'Carrie Ann', 'Buck', 'Republican',
          true, false, false, true, -3203005)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Nevada State Senate'
          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')),
       p.id,
       'State Senator', 'NV', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '<senate geo_id for SD-5>' AND d.district_type = 'STATE_UPPER' AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                           WHERE name = 'Nevada State Senate'
                             AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32'))
  );
```
**CRITICAL details (all three verified against analogs):**
- `d.state = 'nv'` **lowercase** for STATE_UPPER/STATE_LOWER — TIGER loader convention (OR mig used `'or'`, VA used `'va'`). This is the single most important difference from the 159 STATE_EXEC migration which used uppercase `'NV'`. `[VERIFIED: 227_or_state_house.sql line 38, 308_va_delegates line 45, 159-PATTERNS casing rule]`
- `d.district_type` **must** be in the WHERE clause — SLDU and SLDL share the same numeric geo_id space; omitting it causes an ambiguous/duplicate-district subquery. `[VERIFIED: 227 line 11-12, 308 line 15-16]`
- NOT EXISTS guard is on `(district_id, chamber_id)` — single-member pattern. `[VERIFIED]`
- Office `representing_state = 'NV'` uppercase (this is a free-text label column, not the district join key). `[VERIFIED: 270_md / 159-PATTERNS]`

### Pattern 3: Office key — geo_id vs label
The TX analog (109) keys offices on `d.geo_id` (e.g. `'48005'`). The CONTEXT confirms NV Assembly district rows have **geo_id 32001–32042** and `name_formal` like `'Assembly District 1'`. **Senate district geo_ids are not yet confirmed in this research session** (no DB tool available here) — they most likely follow `32001–32021` within the STATE_UPPER `district_type` partition (the geo_id space is shared with SLDL, which is why `district_type` is mandatory). **Planner MUST add a Wave-0 DB probe** to confirm the exact Senate geo_id values and the Assembly `name_formal`/geo_id mapping before writing the 63 WHERE clauses. If geo_ids turn out NOT to be the simple `32` + LPAD(district,3) form, key on `name_formal` (e.g. `d.name_formal = 'Assembly District 1'`) + `district_type` + `state='nv'` instead — the VA/OR analogs show both keying styles are valid.

### Pattern 4: office_id back-fill (per chamber range)
**Source:** `109_tx_state_senate_officials.sql` lines 884-889.
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3203021 AND -3203001   -- senate; repeat -3204042..-3204001 for assembly
  AND p.office_id IS NULL;
```

### Pattern 5: politician_images INSERT (audit-only, no photo_origin_url)
**Source:** `228_or_legislature_headshots.sql` (exact — 90 rows, same shape) + 159-PATTERNS.
```sql
-- 1054_nv_legislature_headshots.sql (AUDIT-ONLY — NOT registered)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3203005),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid>-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3203005)
);
```
- Columns exactly `(id, politician_id, url, type, photo_license)` — **NO `photo_origin_url`**. `[VERIFIED: 159-PATTERNS, 228_or_legislature_headshots.sql]`
- `type = 'default'`. `[VERIFIED]`
- `photo_license`: NV state legislature photos are state-government work → recommend `us_government_work` (228_or used `public_domain` for the same oregonlegislature.gov source; either is defensible — see Open Questions). `[ASSUMED — see A2]`

### Pattern 6: Structural registration (OUTSIDE transaction)
**Source:** 159-PATTERNS / 155-PATTERNS.
```sql
-- After COMMIT, outside BEGIN/COMMIT:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1053', 'nv_legislature')
ON CONFLICT (version) DO NOTHING;
```
The headshot migration (1054) is **NOT** registered (audit-only, applied via `execute_sql`).

### Anti-Patterns to Avoid
- **Uppercase `state='NV'` in the office WHERE clause** → matches ZERO legislature districts (they are `'nv'`), 0 offices created, silent failure.
- **Omitting `district_type`** → ambiguous district match across SLDU/SLDL sharing geo_ids.
- **Including `slug` in chamber INSERT** → `cannot insert a non-DEFAULT value into column slug`.
- **`name_formal = ''`** → breaks profile page rendering (mig 107 lesson).
- **resize-only headshots** → official portraits are 4-6 MB full-frame, arbitrary aspect; MUST crop-to-4:5 first.
- **Inserting any compass stance row** → out of scope; must be 0 at phase close.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resolve ext_id → UUID in headshot script | Hardcode UUIDs before they exist | Runtime `psycopg2` lookup `SELECT id ... WHERE external_id=%s` | UUIDs are created by mig 1053; VA script does this exactly `[VERIFIED]` |
| Crop to 4:5 | Custom math inline | `crop_to_4_5()` from `_tmp-va-delegates-headshots.py` lines 244-271 | Handles both wider+taller cases, eyes-at-top, no distortion |
| Storage upload | New REST wrapper | `upload_to_storage()` with `x-upsert: true` header | Idempotent upsert, proven |
| Roster compilation | Guess from memory | Official leg.state.nv.us "Current" pages (below) | Authoritative + has image IDs |

**Key insight:** Every piece of this phase has a verbatim analog. The risk is NOT novelty — it is the three casing/keying gotchas (lowercase state, mandatory district_type, no slug) and roster currency.

## Runtime State Inventory

> Greenfield seed — no rename/refactor. Most categories N/A. Included for the seed-state dimensions that matter.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — 0 NV legislators currently seated (greenfield per CONTEXT). | Create 63 fresh rows |
| Live service config | None — no external service holds legislator state. | None |
| OS-registered state | None. | None |
| Secrets/env vars | Script reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` from `C:/EV-Accounts/backend/.env` (unchanged). | None |
| Build artifacts | None. | None |
| **Pre-existing geofences (must NOT recreate)** | SLDU (21) + SLDL (42) district rows loaded by Phase 158, `state='nv'` lowercase, Assembly geo_id 32001–32042, name_formal `'Assembly District N'`. | Offices REFERENCE these; never INSERT districts |
| **external_id space (must not collide)** | In use: US House -32001..-32004; STATE_EXEC -3200001..-3200006; senators -400057/-400058. | Use senate -3203001..-3203021, assembly -3204001..-3204042 (free, non-colliding) |

## The Roster (HIGHEST PRIORITY OUTPUT)

**Methodology:** Compiled from the official `leg.state.nv.us` "Current" legislator listing (Senate + Assembly), then independently cross-checked against Wikipedia's `Nevada_Senate` / `Nevada_Assembly` member tables. **All 63 district→name→party assignments agree across both independent sources.** No vacancies in either chamber. Names below use the official-site canonical form (more complete than Wikipedia for several seats). `[VERIFIED: leg.state.nv.us/App/Legislator/A/{Senate,Assembly}/Current + en.wikipedia.org cross-check, 2026-06-23]`

> **Roster currency caveat:** Nevada's last legislative election was Nov 2024; the 83rd (2025) session adjourned June 3 2025; the next election is Nov 2026. Therefore the **current sitting members ARE the 83rd-session members** through 2026 (D-06 satisfied). The official site lists these same people under `Session/84th2027/` image paths (the site pre-stages next-session asset folders) — this is an asset-path quirk, NOT evidence of a roster turnover. Confidence is HIGH for seat existence and MEDIUM-HIGH for any seat that could have had a quiet mid-2026 appointment. **Recommend the planner add an operator-verification checkpoint** (a single `checkpoint:human-verify` reviewing the 63-row roster against leg.state.nv.us before the structural migration is applied).

### Senate (21, STATE_UPPER, external_id -3203001..-3203021)

| Dist | external_id | Full name (canonical) | Party | Official image filename | Confidence |
|-----:|-------------|------------------------|-------|--------------------------|------------|
| 1 | -3203001 | Michelee "Shelly" Cruz-Crawford | Democratic | CruzCrawford.MicheleeShelly.419 | HIGH |
| 2 | -3203002 | Edgar Flores | Democratic | Flores.Edgar.273 | HIGH |
| 3 | -3203003 | Rochelle T. Nguyen | Democratic | Nguyen.Rochelle.372 | HIGH |
| 4 | -3203004 | Dina Neal | Democratic | Neal.Dina.129 | HIGH |
| 5 | -3203005 | Carrie Ann Buck | Republican | Buck.Carrie.387 | HIGH |
| 6 | -3203006 | Nicole J. Cannizzaro | Democratic | Cannizzaro.Nicole.347 | HIGH |
| 7 | -3203007 | Roberta Lange | Democratic | Lange.Roberta.383 | HIGH |
| 8 | -3203008 | Marilyn Dondero Loop | Democratic | DonderoLoop.Marilyn.92 | HIGH |
| 9 | -3203009 | Melanie Scheible | Democratic | Scheible.Melanie.358 | HIGH |
| 10 | -3203010 | Fabian Doñate | Democratic | Doate.Fabian.350 | HIGH |
| 11 | -3203011 | Lori Rogich | Republican | Rogich.Lori.425 | HIGH (appointed; see note) |
| 12 | -3203012 | Julie Pazina | Democratic | Pazina.Julie.391 | HIGH |
| 13 | -3203013 | Skip Daly | Democratic | Daly.Skip.155 | HIGH |
| 14 | -3203014 | Ira Hansen | Republican | Hansen.Ira.157 | HIGH |
| 15 | -3203015 | Angela D. Taylor | Democratic | Taylor.Angela.424 | HIGH |
| 16 | -3203016 | Lisa Krasner | Republican | Krasner.Lisa.327 | HIGH |
| 17 | -3203017 | Robin L. Titus | Republican | Titus.Robin.281 | HIGH |
| 18 | -3203018 | John C. Steinbeck | Republican | Steinbeck.John.418 | HIGH (appointed; see note) |
| 19 | -3203019 | John Ellison | Republican | Ellison.John.417 | HIGH |
| 20 | -3203020 | Jeff Stone | Republican | Stone.Jeff.390 | HIGH |
| 21 | -3203021 | James Ohrenschall | Democratic | Ohrenschall.James.67 | HIGH |

**Senate composition:** 13 Democratic / 8 Republican. No vacancies.
**Appointment notes:** SD-11 Rogich and SD-18 Steinbeck appear in the current roster as appointees who took seats during/after 2024-2025 (county-commission appointments to fill vacancies). Treat as `is_active=true, is_appointed=false, is_incumbent=true` like every other sitting member unless the operator-verification step indicates `is_appointed=true` is desired. `[ASSUMED — see A3]`

### Assembly (42, STATE_LOWER, external_id -3204001..-3204042)

| Dist | external_id | Full name (canonical) | Party | Official image filename | Confidence |
|-----:|-------------|------------------------|-------|--------------------------|------------|
| 1 | -3204001 | Daniele Monroe-Moreno | Democratic | MonroeMoreno.Daniele.307 | HIGH |
| 2 | -3204002 | Heidi Kasama | Republican | Kasama.Heidi.379 | HIGH |
| 3 | -3204003 | Selena Torres-Fossett | Democratic | TorresFossett.Selena.359 | HIGH |
| 4 | -3204004 | Lisa K. Cole | Republican | Cole.Lisa.410 | HIGH |
| 5 | -3204005 | Brittney M. Miller | Democratic | Miller.Brittney.304 | HIGH |
| 6 | -3204006 | Jovan A. Jackson | Democratic | Jackson.Jovan.422 | HIGH |
| 7 | -3204007 | Tanya P. Flanagan | Democratic | Flanagan.Tanya.423 | HIGH |
| 8 | -3204008 | Duy Nguyen | Democratic | Nguyen.Duy.392 | HIGH |
| 9 | -3204009 | Steve Yeager | Democratic | Yeager.Steve.310 | HIGH (Speaker) |
| 10 | -3204010 | Venise Karris | Democratic | Karris.Venise.421 | HIGH |
| 11 | -3204011 | Cinthia Zermeño Moore | Democratic | Moore.CinthiaZermeo.412 | HIGH |
| 12 | -3204012 | Max E. Carter II | Democratic | Carter.Max.393 | HIGH |
| 13 | -3204013 | Brian Hibbetts | Republican | Hibbetts.Brian.394 | HIGH |
| 14 | -3204014 | Erica Mosca | Democratic | Mosca.Erica.395 | HIGH |
| 15 | -3204015 | Howard Watts III | Democratic | Watts.Howard.363 | HIGH |
| 16 | -3204016 | Cecelia González | Democratic | Gonzlez.Cecelia.378 | HIGH |
| 17 | -3204017 | Linda F. Hunt | Democratic | Hunt.Linda.420 | HIGH |
| 18 | -3204018 | Venicia Considine | Democratic | Considine.Venicia.380 | HIGH |
| 19 | -3204019 | Jason Patchett | Republican | Patchett.Jason.426 | HIGH (began 2025) |
| 20 | -3204020 | David Orentlicher | Democratic | Orentlicher.David.377 | HIGH |
| 21 | -3204021 | Elaine H. Marzola | Democratic | Marzola.Elaine.376 | HIGH |
| 22 | -3204022 | Melissa R. Hardy | Republican | Hardy.Melissa.364 | HIGH |
| 23 | -3204023 | Danielle Gallant | Republican | Gallant.Danielle.397 | HIGH |
| 24 | -3204024 | Erica P. Roth | Democratic | Roth.Erica.413 | HIGH |
| 25 | -3204025 | Selena La Rue Hatch | Democratic | LaRueHatch.Selena.398 | HIGH |
| 26 | -3204026 | Rich DeLong | Republican | DeLong.Richard.399 | HIGH |
| 27 | -3204027 | Heather Goulding | Democratic | Goulding.Heather.416 | HIGH |
| 28 | -3204028 | Reuben D'Silva | Democratic | DSilva.Reuben.401 | HIGH |
| 29 | -3204029 | Joe Dalia | Democratic | Dalia.Joe.414 | HIGH |
| 30 | -3204030 | Natha C. Anderson | Democratic | Anderson.Natha.375 | HIGH |
| 31 | -3204031 | Jill Dickman | Republican | Dickman.Jill.277 | HIGH |
| 32 | -3204032 | Alexis M. Hansen | Republican | Hansen.Alexis.366 | HIGH |
| 33 | -3204033 | Bert K. Gurr | Republican | Gurr.Bert.402 | HIGH |
| 34 | -3204034 | Hanadi Nadeem | Democratic | Nadeem.Hanadi.415 | HIGH |
| 35 | -3204035 | Rebecca Edgeworth | Republican | Edgeworth.Rebecca.411 | HIGH |
| 36 | -3204036 | Gregory T. Hafen II | Republican | Hafen.Gregory.371 | HIGH |
| 37 | -3204037 | Shea M. Backus | Democratic | Backus.Shea.368 | HIGH |
| 38 | -3204038 | Gregory S. Koenig | Republican | Koenig.Gregory.403 | HIGH |
| 39 | -3204039 | Blayne Osborn | Republican | Osborn.Blayne.427 | HIGH (began 2025) |
| 40 | -3204040 | P. K. O'Neill | Republican | ONeill.PhilipPK.285 | HIGH |
| 41 | -3204041 | Sandra Jauregui | Democratic | Jauregui.Sandra.344 | HIGH |
| 42 | -3204042 | Tracy Brown-May | Democratic | BrownMay.Tracy.353 | HIGH |

**Assembly composition:** 27 Democratic / 15 Republican. No vacancies.

**Diacritics — preserve in `full_name`** (the analog migs preserve José/César; image filenames strip them, the DB does not): Fabian **Doñate** (SD-10), Cecelia **González** (AD-16), Cinthia **Zermeño** Moore (AD-11). `[VERIFIED: leg.state.nv.us roster + 109_tx pattern]`

### Leadership availability (D-05 — trivially available, optional)
If the planner elects to fold leadership into the base title (D-05 allows but does not require): **Steve Yeager (AD-9) = Speaker of the Assembly**; **Nicole Cannizzaro (SD-6) = Senate Majority Leader** (2025 session). These two are well-documented. Recommendation: seed uniform base titles (`State Senator`/`Assemblymember`) and leave leadership for a later polish — folding it in risks stale titles after the next election and is not needed for routing. `[CITED: en.wikipedia.org/wiki/Nevada_Legislature]`

## Headshot Sources

**Primary (D-01) — official Nevada Legislature archive (VERIFIED working for all 63):**
```
Full-size (USE THIS):  https://archive.leg.state.nv.us/Session/84th2027/legislators/Senators/Images/{Mangled}.{id}.jpg
                       https://archive.leg.state.nv.us/Session/84th2027/legislators/Assembly/Images/{Mangled}.{id}.jpg
Also resolves via:     https://www.leg.state.nv.us/Session/84th2027/legislators/{Senators|Assembly}/Images/{Mangled}.{id}.jpg
                       (302-redirects to the archive host — follow with curl -L)
```
- `{Mangled}.{id}` values are listed per-member in the roster tables above (e.g. `Buck.Carrie.387`, `MonroeMoreno.Daniele.307`).
- **Use the full-size variant** (drop the `.Thumb` suffix the page lists): full-size files are **3.9–6 MB, high-resolution, arbitrary aspect** → **crop-to-4:5 then resize 600×750** (confirms D-01 crop-first, NOT resize-only). The `.Thumb.jpg` variant is only ~7–8 KB (too small). `[VERIFIED: curl 2026-06-23 — Buck.Carrie.387.jpg = 3,918,638 B image/jpeg HTTP 200; MonroeMoreno.307.jpg = 5,971,871 B; Gonzlez.378.jpg = 5,996,794 B; ONeill.285.jpg = 4,255,028 B]`
- **Path is `Senators` (plural) for Senate, `Assembly` for Assembly.** `[VERIFIED]`
- **Name-mangling rule** (for constructing URLs / verifying): strip spaces, dots, apostrophes, hyphens, and diacritics from the surname and given name, concatenate compound surnames. Observed: Doñate→`Doate`, González→`Gonzlez`, Cinthia Zermeño→`CinthiaZermeo`, D'Silva→`DSilva`, Brown-May→`BrownMay`, Monroe-Moreno→`MonroeMoreno`, La Rue Hatch→`LaRueHatch`, Torres-Fossett→`TorresFossett`, O'Neill (P.K.)→`ONeill.PhilipPK`, Cruz-Crawford (Michelee "Shelly")→`CruzCrawford.MicheleeShelly`. **The safest implementation is to hardcode the 63 exact filenames from the roster tables** (they are already verified) rather than re-derive them. `[VERIFIED]`
- **License:** Nevada state legislature official portraits = state-government work. Record `photo_license='us_government_work'` (or `'public_domain'` to match the OR 228 precedent for an equivalent state-legislature source). `[ASSUMED — see A2]`

**Fallback (D-02), only if a primary URL fails:** Wikipedia/Wikimedia Commons → Open States (`openstates.org`, which mirrors official legislature photos). If a Wikimedia URL is hit, the download MUST use a descriptive User-Agent or it returns **HTTP 429** (learned in Phase 159). `[VERIFIED: 159-01-SUMMARY deviation]`
```python
WIKIMEDIA_UA = 'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)'
```
**Note:** the `archive.leg.state.nv.us` host served full-size JPEGs fine with a normal browser UA in testing; the Wikimedia descriptive-UA rule applies only to `*.wikimedia.org` fallback fetches.

**Gap policy (D-03):** All 63 primary URLs were confirmed reachable in research, so a genuine gap is unlikely. If any single download fails at execution time and no fallback portrait exists, create the office row anyway and document the gap in SUMMARY — do not fabricate.

## Common Pitfalls

### Pitfall 1: Uppercase state on the office district join
**What goes wrong:** Using `d.state='NV'` (like the 159 STATE_EXEC migration) matches zero STATE_UPPER/STATE_LOWER rows; all 63 office INSERTs silently no-op.
**Why:** TIGER loader writes legislature districts with lowercase `'nv'`; 159 hand-wrote STATE_EXEC with uppercase `'NV'`. They genuinely differ.
**How to avoid:** Every office WHERE clause uses `d.state = 'nv'`. Add a Wave-0 probe asserting `COUNT(*)=21` STATE_UPPER and `=42` STATE_LOWER at `state='nv'`.
**Warning signs:** Migration "succeeds" but `SELECT COUNT(*) FROM offices WHERE chamber_id IN (...)` returns 0.

### Pitfall 2: Missing district_type → ambiguous district
**What goes wrong:** SLDU and SLDL geo_ids overlap (e.g. `32005` may exist in both); without `district_type` the subquery matches 2 districts.
**How to avoid:** Always include `d.district_type = 'STATE_UPPER'` (Senate) / `'STATE_LOWER'` (Assembly). `[VERIFIED: 227 line 11-12]`

### Pitfall 3: slug in chamber INSERT
**What goes wrong:** `cannot insert a non-DEFAULT value into column slug`. **Avoid:** exclude `slug`; it is GENERATED ALWAYS.

### Pitfall 4: name_formal = ''
**What goes wrong:** Empty `name_formal` breaks profile-page render (mig 107). **Avoid:** set `name_formal = name` for both chambers.

### Pitfall 5: photo_origin_url column
**What goes wrong:** `column "photo_origin_url" does not exist`. **Avoid:** `politician_images` is exactly `(id, politician_id, url, type, photo_license)`. `[VERIFIED: 159-PATTERNS]`

### Pitfall 6: Two-chamber section-split
**What goes wrong:** A legislator's office accidentally attaches to a chamber under a different government → person shows under two governments.
**How to avoid:** Both chambers scoped to `government_id = (SELECT id FROM governments WHERE geo_id='32')`. Run the section-split SQL (below) for STATE_UPPER+STATE_LOWER; expect 0 rows.

### Pitfall 7: Registering the headshot migration
**What goes wrong:** Inserting 1054 into `schema_migrations` corrupts the ledger. **Avoid:** 1053 registered; 1054 applied via `execute_sql`, NOT registered. Ledger MAX = 1053 after phase.

### Pitfall 8: Grep gates on forbidden tokens
**Note from 159:** automated gates flagged literal tokens `slug`, `schema_migrations`, `photo_origin_url` appearing in SQL file comments. The 159 executor reworded header comments to avoid these tokens. Planner should expect the same gate behavior. `[VERIFIED: 159-01-SUMMARY deviation]`

## Code Examples

### Headshot script skeleton (NV legislature) — adapt from `_tmp-va-delegates-headshots.py`
```python
# Source: _tmp-va-delegates-headshots.py (verbatim pipeline) — NV roster substituted.
# ROSTER entries: {'ext_id', 'name', 'image': 'Buck.Carrie.387', 'chamber': 'Senators'}
SENATE_BASE   = 'https://archive.leg.state.nv.us/Session/84th2027/legislators/Senators/Images/'
ASSEMBLY_BASE = 'https://archive.leg.state.nv.us/Session/84th2027/legislators/Assembly/Images/'
# full-size = {image}.jpg  (NOT .Thumb.jpg); crop_to_4_5() then resize_600x750()
# resolve_politician_id(cursor, ext_id) -> UUID at runtime (psycopg2, DATABASE_URL from .env)
# upload_to_storage(uuid, jpeg_bytes) -> politician_photos/{uuid}-headshot.jpg, x-upsert:true
# Emit a SUCCESS/FAILED manifest line per member; hard-gate 63/63.
```
The crop, resize, and upload functions are copied unchanged from `_tmp-va-delegates-headshots.py` lines 244-300. `[VERIFIED]`

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Hardcode politician UUIDs in headshot script | Runtime `psycopg2` lookup by external_id | UUIDs created by the migration don't exist when the script is written |
| `.Thumb.jpg` small portraits | Full-size `.jpg` (drop .Thumb) | High-res source → clean 600×750 after crop |
| resize-only | crop-to-4:5 then resize | Official full-frame portraits are not 4:5 |

**Deprecated/outdated:** `photo_origin_url` column (removed from `politician_images`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Senate district geo_ids follow `32001..32021` within STATE_UPPER (Assembly confirmed 32001..32042 in CONTEXT) | Pattern 3 | If wrong, office WHERE clauses match nothing → 0 senators routed. **Planner MUST DB-probe in Wave 0.** Mitigation: key on `name_formal`+`district_type`+`state` if geo_id form differs. |
| A2 | `photo_license = 'us_government_work'` for NV legislature portraits | Pattern 5 / Headshot Sources | Low — both `us_government_work` and `public_domain` are accepted enum-ish values in the DB; OR 228 used `public_domain` for an analogous source. Operator picks. |
| A3 | SD-11 Rogich & SD-18 Steinbeck seeded `is_appointed=false` (uniform with peers) | Senate roster note | Cosmetic; `is_appointed` is not displayed antipartisan-style. Operator may set true. |
| A4 | Roster has no quiet mid-2026 appointment/resignation beyond what both sources show | Roster | Medium — covered by recommended operator-verification checkpoint. |

## Open Questions

1. **Exact Senate SLDU geo_id values and Assembly name_formal/geo_id mapping**
   - Known: Assembly geo_id 32001–32042, name_formal `'Assembly District N'`, state `'nv'` (CONTEXT, DB-verified).
   - Unclear: Senate geo_id values (not probeable in this research session — no DB tool).
   - Recommendation: Planner adds a **Wave-0 DB probe** (`SELECT district_type, geo_id, name_formal FROM essentials.districts WHERE district_type IN ('STATE_UPPER','STATE_LOWER') AND state='nv' ORDER BY 1,2`) and asserts 21 SLDU + 42 SLDL before authoring WHERE clauses. Key offices on geo_id if simple, else on name_formal.

2. **photo_license value** — `us_government_work` vs `public_domain` (A2). Default to `us_government_work`; operator can override.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `archive.leg.state.nv.us` photos | Headshots (all 63) | ✓ | full-size .jpg, HTTP 200 | Wikimedia/openstates (D-02) |
| Supabase Storage `politician_photos` | Headshot upload | ✓ | live (CDN base confirmed) | — |
| Python3 + Pillow + requests + psycopg2 | Headshot script | ✓ (repo scripts use them) | — | — |
| Supabase DB (apply_migration/execute_sql) | Migrations | ✓ (inline-orchestrator only) | live | — |
| `C:/EV-Accounts/backend/.env` (SUPABASE_URL, SERVICE_ROLE_KEY, DATABASE_URL) | Script auth | ✓ | — | — |

**Missing dependencies with no fallback:** None.
**Note:** PIL/psycopg2/DB are unavailable in the *research-agent* shell (confirmed) but ARE available to the *inline orchestrator* that runs the script and applies migrations — this matches the documented executor/orchestrator split and is not a blocker.

## Validation Architecture

> nyquist_validation: config has no explicit key → treated as ENABLED. This phase is data-seed, not code; validation is SQL/HTTP assertions runnable by the inline orchestrator (no unit-test framework in this repo for seed data).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | SQL assertions via Supabase `execute_sql` + `curl` HTTP-200 checks (no pytest/jest for seed data) |
| Config file | none — inline orchestrator runs the queries |
| Quick run command | the per-criterion SQL below |
| Full suite command | run all 6 checks; all must pass before `/gsd:verify-work` |

### Phase Requirements → Test Map
| Req | Behavior | Test | Command | Exists? |
|-----|----------|------|---------|---------|
| NV-LEG-01 | 21 senators routed | count offices in Senate chamber | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.name='Nevada State Senate' AND c.government_id=(SELECT id FROM essentials.governments WHERE geo_id='32');` → 21 | ✅ |
| NV-LEG-02 | 42 assembly routed | count offices in Assembly chamber | same with `c.name='Nevada Assembly'` → 42 | ✅ |
| NV-LEG-01/02 | offices link SLDU/SLDL | districts join | `SELECT d.district_type, COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.government_id=(SELECT id FROM essentials.governments WHERE geo_id='32') AND c.name IN ('Nevada State Senate','Nevada Assembly') GROUP BY 1;` → STATE_UPPER 21, STATE_LOWER 42 | ✅ |
| NV-LEG-01/02 | 63 headshots present | images count | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id BETWEEN -3204042 AND -3203001) AND type='default';` → 63 (minus any documented D-03 gaps) | ✅ |
| NV-LEG-01/02 | headshots serve | CDN HTTP 200 | `curl -sI <each CDN url>` → 200 (spot-check + count) | ✅ |
| SC#4 | 0 stances | stance count | `SELECT COUNT(*) FROM inform.politician_answers WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id BETWEEN -3204042 AND -3203001);` → 0 | ✅ |
| NV-GEO | casing correct | district state casing | `SELECT DISTINCT state FROM essentials.districts d JOIN essentials.offices o ON o.district_id=d.id JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.government_id=(SELECT id FROM essentials.governments WHERE geo_id='32') AND c.name IN ('Nevada State Senate','Nevada Assembly');` → only `'nv'` | ✅ |
| NV-GEO | section-split clean | split scan | section-split SQL below → 0 rows | ✅ |
| ledger | 1053 registered, 1054 not | ledger | `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('1053','1054');` → only 1053 | ✅ |

### Section-Split Verification SQL (adapted to STATE_UPPER/STATE_LOWER)
```sql
-- Expect 0 rows.
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.state = 'nv' AND d.district_type IN ('STATE_UPPER','STATE_LOWER')
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
```

### Address-routing spot check
- Per CONTEXT: legislators are address-routed (not in the statewide-officials list). Pick a known Las Vegas address, call `/representatives/me`, assert the returned State Senator + Assemblymember match the SLDU/SLDL the address falls in.
- Browse link for surfacing review: `essentials.empowered.vote/results?browse_state_officials=NV` (state officials list) plus address tests for SLDU/SLDL.

### Sampling Rate
- **Per migration apply:** count check for that chamber (21 or 42).
- **Per phase gate:** all 9 checks green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] DB probe: confirm 21 STATE_UPPER + 42 STATE_LOWER districts at `state='nv'`, capture exact geo_id / name_formal mapping (resolves A1/Open Q1).
- [ ] DB probe: confirm external_id ranges -3203001..-3203021 and -3204001..-3204042 are unused.
- [ ] Operator-verification checkpoint: review the 63-row roster against leg.state.nv.us before applying 1053 (resolves A4).
- [ ] No test framework install needed (SQL/HTTP assertions only).

## Security Domain

> `security_enforcement` not set in config → treated as enabled. This is a read-only-source data-seed phase; minimal attack surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no auth changes) |
| V3 Session Management | no | — |
| V4 Access Control | no | service-role key used only by inline orchestrator (not committed) |
| V5 Input Validation | yes | All seed data is from authoritative gov sources; SQL uses parameterized/literal idempotent inserts; image bytes re-encoded via PIL (strips EXIF/stego) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious image payload from remote source | Tampering | PIL re-encode to clean JPEG (drops EXIF/embedded data) — already in pipeline `[VERIFIED: VA script line 357 optimize re-encode]` |
| Service-role key leakage | Information disclosure | Key lives in gitignored `.env`; scripts are gitignored `_tmp-*`; never committed |
| Wrong-government section split | (data integrity) | Section-split SQL gate (0 rows) |

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/108_tx_state_legislature_chambers.sql` — two-chamber INSERT pattern
- `C:/EV-Accounts/backend/migrations/109_tx_state_senate_officials.sql` — CTE politician+office, vacancy row, office_id back-fill
- `C:/EV-Accounts/backend/migrations/227_or_state_house.sql` — greenfield office→existing-TIGER-district, lowercase state, mandatory district_type (closest analog)
- `C:/EV-Accounts/backend/migrations/308_va_delegates.sql` (read as `319` ref) — STATE_LOWER pattern, vacant-seat handling, p.id IS NOT NULL guard
- `C:/EV-Accounts/backend/migrations/228_or_legislature_headshots.sql` — audit-only politician_images, 90-row state-legislature precedent
- `C:/EV-Accounts/backend/scripts/_tmp-va-delegates-headshots.py` — crop-4:5/resize/upload/UUID-resolve pipeline
- `.planning/phases/159-nevada-state-federal-government/159-PATTERNS.md` + `159-01-SUMMARY.md` — casing rule, column shape, ledger, Wikimedia UA, grep-gate tokens
- `https://www.leg.state.nv.us/App/Legislator/A/Senate/Current` + `/Assembly/Current` — official roster + image IDs (curl 2026-06-23)
- `archive.leg.state.nv.us/Session/84th2027/legislators/...` — headshot URLs verified HTTP 200, full-size

### Secondary (MEDIUM confidence)
- `https://en.wikipedia.org/wiki/Nevada_Senate`, `https://en.wikipedia.org/wiki/Nevada_Assembly` — roster cross-check (agreed on all 63 seats)
- `https://en.wikipedia.org/wiki/Nevada_Legislature` — leadership (Yeager Speaker, Cannizzaro Majority Leader)

### Tertiary (LOW confidence)
- None relied upon.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verbatim analogs, no new packages
- Architecture / SQL patterns: HIGH — TX/OR/VA migrations are exact role-matches
- Roster: MEDIUM-HIGH — official + Wikipedia agree on all 63; operator-verify checkpoint recommended for any silent mid-2026 change
- Headshot sources: HIGH — all 63 URLs verified HTTP 200 full-size; crop-first confirmed by byte size
- Senate geo_id mapping: MEDIUM — Assembly confirmed in CONTEXT, Senate needs Wave-0 DB probe (A1)

**Research date:** 2026-06-23
**Valid until:** 2026-11-03 (next NV legislative election) for the roster; structural patterns indefinite.

## RESEARCH COMPLETE

**Phase:** 160 - Nevada Legislature (seed + headshots)
**Confidence:** HIGH (patterns/headshots) / MEDIUM-HIGH (roster)

### Key Findings
- **Full 63-member roster compiled and cross-verified** (official leg.state.nv.us + Wikipedia agree on every seat): 21 Senate (13 D / 8 R), 42 Assembly (27 D / 15 R), **no vacancies**. District→name→party→external_id→image-filename tables are in RESEARCH.md.
- **Headshot URLs verified HTTP 200 for all 63** at `archive.leg.state.nv.us/Session/84th2027/legislators/{Senators|Assembly}/Images/{Mangled}.{id}.jpg` (full-size, 4–6 MB, arbitrary aspect → crop-to-4:5 then resize, confirming D-01). Exact per-member filenames captured.
- **Exact SQL analogs identified**: `227_or_state_house.sql` (office→existing district, lowercase `state='nv'`, mandatory `district_type`), `108_tx` (chambers), `228_or` (audit headshots). Non-colliding external_ids: senate -3203001..-3203021, assembly -3204001..-3204042.
- **Three load-bearing gotchas**: lowercase `state='nv'` (NOT the uppercase 'NV' that 159 used for STATE_EXEC), mandatory `district_type` (shared geo_id space), no `slug` / no `photo_origin_url`.
- **Two open items for the planner's Wave 0**: DB-probe the exact Senate SLDU geo_id/name_formal mapping (A1), and an operator-verification checkpoint on the roster (A4).

### File Created
`C:/Transparent Motivations/essentials/.planning/phases/160-nevada-legislature-seed-headshots/160-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | verbatim analogs, no installs |
| Architecture | HIGH | TX/OR/VA exact role-matches |
| Pitfalls | HIGH | casing/keying gotchas verified against analog source |
| Roster | MEDIUM-HIGH | two independent sources agree on 63/63 |
| Headshots | HIGH | all 63 URLs HTTP-200 verified this session |

### Open Questions
1. Exact Senate SLDU geo_id values (Assembly confirmed 32001–32042) — Wave-0 DB probe.
2. photo_license value: `us_government_work` vs `public_domain` — operator default.

### Ready for Planning
Research complete. The planner can author 1053 (structural, registered) + 1054 (audit headshots) + the gitignored headshot script directly from the roster/URL tables, adding the two Wave-0 DB probes and a roster operator-verification checkpoint.
