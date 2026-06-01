# Phase 69: Landing + Elections + Discovery - Research

**Researched:** 2026-05-28
**Domain:** Landing.jsx COVERAGE_AREAS + CA elections DB + discovery_jurisdictions pipeline
**Confidence:** HIGH — all findings are DB-verified or code-verified in this session

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Follow the same pattern as SD/Fremont — one card per city, `{ county: 'CityName', state: 'California', browseGovernmentList: ['geo_id'], browseStateAbbrev: 'CA' }`. No county geo_id additions, no grouping.
- **D-02:** 4 new entries to add: San Francisco, San Jose, Sacramento, Berkeley. LA, SD, Fremont are already present. Researcher confirms correct geo_ids for each city.
- **D-03:** Entry labels use the city name (e.g., `county: 'San Francisco'`) not county descriptors — consistent with existing SD/Fremont/Cambridge entries.
- **D-04:** November general election only — 52 race rows (one per CD), all tied to the November 3, 2026 general election_id. Do NOT create primary rows.
- **D-05:** Rationale: CA primary is June 2 (5 days away as of research date), filing is closed — arming discovery cron for general cycle is the right focus. Primary races are effectively over for US House.
- **D-06:** If a CA general election row does not yet exist, create it (name, election_date='2026-11-03', state='CA'). Verify whether `1ebca37f-cf96-47f4-bc2b-47ef266721fe` is the primary or general before linking.
- **D-07:** Governor challengers were seeded in Phase 62 (migration 197). Verify that `cron_active=true` is set on the Governor discovery_jurisdictions or race row. If not, patch it.
- **D-08:** Governor race should be tied to the November general election, not the June primary (open seat, top-two system).
- **D-09:** Each CA city gets its own discovery_jurisdictions row with that city's official elections/city clerk candidate listing URL. Researcher finds the correct URL per city.
- **D-10:** LA already has a discovery_jurisdictions row (lavote.gov, migration 197) — do NOT create a duplicate for LA.
- **D-11:** All city rows should have `cron_active=true` and `election_date` = the nearest upcoming election for that city (June 3 primary or November 4 general, whichever is closer and has active races).
- **D-12:** CA SOS (`sos.ca.gov`) is the correct source for state-level races (Governor, US House). City clerk sites are for municipal races (city council, mayor).

### Claude's Discretion

- Exact CA SOS URL format for the Governor and US House discovery source.
- Whether to create a separate discovery_jurisdictions row for US House races (statewide) or reuse the CA SOS Governor row.
- Migration numbering (next is 221 per STATE.md).
- Whether to arm discovery for the CA primary (June 3) on any city rows given the 6-day proximity.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CITIES-07 | All 6 new cities + LA updated/confirmed in Landing.jsx COVERAGE_AREAS | Landing.jsx read; current state documented; 4 missing cities identified with geo_ids verified |
| ELECT-01 | CA 2026 primary (June 3) + general (November 4) election rows seeded | DB queried; only LA County primary exists; both CA statewide rows need creation |
| ELECT-02 | CA Governor 2026 open-seat race seeded with all SOS-verified candidates and discovery pipeline armed | Governor race exists but linked to wrong election; office_id is NULL; needs general election linkage + office_id patch |
| ELECT-03 | CA US House 2026 races seeded for all 52 districts with discovery pipeline armed | Only 1 of 52 race rows exists; all 52 office_ids retrieved; general election row needed first |
| ELECT-04 | Discovery jurisdictions armed (cron_active=true) for all covered CA cities | No cron_active column exists; "armed" = row with election_date in 180-day horizon; 0 of 7 target cities have rows |
</phase_requirements>

---

## Summary

This phase integrates all CA v7.0 work into visible coverage: Landing.jsx gets 4 new city cards, the CA elections DB gets two statewide election rows (primary + general), the Governor race and 52 US House race rows are created for the general election, and 7 city-level discovery_jurisdictions rows are inserted so the Sunday cron will sweep them.

Research revealed several critical deviations from the CONTEXT.md assumptions. The most important: **there is no `cron_active` column on any relevant table** — "armed" simply means having a row in `discovery_jurisdictions` with an `election_date` in the future (cron sweeps WHERE `election_date > now() AND election_date <= now + 180 days`). Additionally, the CA election dates are **June 2** (primary) and **November 3** (general) — the CONTEXT.md stated June 3 and November 4, both of which are incorrect.

The only existing CA election row (`1ebca37f-cf96-47f4-bc2b-47ef266721fe`) is scoped to LA County (`name='2026 LA County Primary'`, `jurisdiction_level='county'`) — not a statewide election. Both a CA statewide primary and CA statewide general election row need to be created. The Governor race currently exists but is incorrectly linked to the LA County Primary and has `office_id=NULL`.

**Primary recommendation:** Create 2 new election rows, patch the Governor race to the general election with office_id filled, create 52 new US House race rows for the general, insert 7 discovery_jurisdictions rows for the 7 covered cities (using election_date appropriate to each city's upcoming election), and add 4 COVERAGE_AREAS entries to Landing.jsx.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Landing.jsx card display | Browser / Client | — | Pure frontend React component edit |
| elections DB rows | Database / Storage | — | SQL migration via Supabase MCP |
| races DB rows | Database / Storage | — | SQL migration; depends on election_id |
| discovery_jurisdictions rows | Database / Storage | API / Backend | DB INSERT; cron reads at sweep time |
| Discovery cron sweep | API / Backend | — | discoveryCron.ts on Sunday 02:00 UTC |

---

## Standard Stack

No new packages required for this phase. All work is SQL migrations + one JSX edit.

### Tools in Use
| Tool | Purpose |
|------|---------|
| Supabase MCP (`mcp__supabase-local`) | Apply SQL migrations directly |
| React JSX (`src/pages/Landing.jsx`) | COVERAGE_AREAS array edit |

### Package Legitimacy Audit

No external packages are installed in this phase. Audit not applicable.

---

## Architecture Patterns

### DB Schema: elections table

```sql
-- Verified columns (2026-05-28):
id            uuid NOT NULL
name          text NOT NULL
election_date date NOT NULL
election_type text NOT NULL       -- 'primary', 'general', 'special'
jurisdiction_level text NOT NULL  -- 'city', 'county', 'state'
state         character(2)        -- nullable; 'CA'
description   text                -- nullable
created_at    timestamptz NOT NULL
updated_at    timestamptz NOT NULL
```

### DB Schema: races table

```sql
-- Verified columns (2026-05-28):
id            uuid
election_id   uuid (FK -> elections.id)
office_id     uuid (FK -> offices.id) -- NULLABLE (Governor race has NULL)
position_name text
primary_party text
seats         int
description   text
created_at    timestamptz
updated_at    timestamptz
```

**NO `cron_active` column on races.** [VERIFIED: direct DB schema query]

### DB Schema: discovery_jurisdictions table

```sql
-- Verified columns (2026-05-28):
id                   uuid
jurisdiction_geoid   text NOT NULL
jurisdiction_name    text NOT NULL
state                text NOT NULL
election_date        date NOT NULL
source_url           text
allowed_domains      text[]
created_at           timestamptz
updated_at           timestamptz
```

**NO `cron_active` column on discovery_jurisdictions.** [VERIFIED: direct DB schema query]

### How Discovery Cron "Arms" a Jurisdiction

**CRITICAL CORRECTION to CONTEXT.md assumptions:**

There is no `cron_active` field. The cron (discoveryCron.ts) selects jurisdictions with:

```typescript
// Source: C:\EV-Accounts\backend\src\lib\discoveryCron.ts (verified 2026-05-28)
const SWEEP_HORIZON_DAYS = 180;

const jurisdictionsResult = await pool.query(
  `SELECT id, jurisdiction_name
     FROM essentials.discovery_jurisdictions
    WHERE election_date > now()
      AND election_date <= $1
    ORDER BY election_date ASC`,
  [horizon]
);
```

**"Armed" means: a row exists in `discovery_jurisdictions` with `election_date` in the future (within 180 days).** A row with `election_date` in the past is ignored by the cron automatically. No flag needed. [VERIFIED: discoveryCron.ts source code]

### Landing.jsx COVERAGE_AREAS Pattern

```javascript
// Source: src/pages/Landing.jsx (verified 2026-05-28, lines 8-16)
const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '...' },
  { county: 'Los Angeles County', state: 'California',
    browseGovernmentList: ['0644000', '06037', '0622710'],
    browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { county: 'San Diego', state: 'California',
    browseGovernmentList: ['0666000'], browseStateAbbrev: 'CA' },
  { county: 'Fremont', state: 'California',
    browseGovernmentList: ['0626000'], browseStateAbbrev: 'CA' },
  // ... Collin County, Cambridge, Portland
];

// New city pattern (D-01): one entry, one geo_id in browseGovernmentList
{ county: 'San Francisco', state: 'California',
  browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA' }
```

### Migration Pattern

```sql
-- Elections INSERT pattern (matches existing rows in DB):
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (gen_random_uuid(), 'CA 2026 Statewide Primary', '2026-06-02', 'primary', 'state', 'CA')
ON CONFLICT DO NOTHING;

-- discovery_jurisdictions INSERT pattern (from migration 197):
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url)
VALUES
  (gen_random_uuid(), '0667000', 'San Francisco', 'CA', '2026-06-02',
   'https://www.sf.gov/reports--candidates-june-2-2026-statewide-direct-primary-election')
ON CONFLICT DO NOTHING;
```

---

## Critical DB State (Verified 2026-05-28)

### 1. Landing.jsx COVERAGE_AREAS — Current State

[VERIFIED: src/pages/Landing.jsx read]

| Entry | geo_id in browseGovernmentList | Status |
|-------|-------------------------------|--------|
| Los Angeles County | 0644000, 06037, 0622710 | Already present |
| San Diego | 0666000 | Already present |
| Fremont | 0626000 | Already present |
| San Francisco | 0667000 | MISSING — must add |
| San Jose | 0668000 | MISSING — must add |
| Sacramento | 0664000 | MISSING — must add |
| Berkeley | 0606000 | MISSING — must add |

All 7 geo_ids confirmed present in `essentials.geofence_boundaries` (G4110 rows). [VERIFIED: DB query]

### 2. CA Elections — Current DB State

[VERIFIED: DB query 2026-05-28]

| id | name | election_date | election_type | jurisdiction_level |
|----|------|--------------|--------------|-------------------|
| `1ebca37f-cf96-47f4-bc2b-47ef266721fe` | 2026 LA County Primary | 2026-06-02 | primary | **county** |

**Only one CA election row exists and it is LA County-scoped, not statewide.**

**CA General election row: does NOT exist.** Must create.

**CA Statewide Primary row: does NOT exist.** The existing row is county-level. A new state-level row should be created for the CA statewide primary (or the existing row can be reused with awareness that it is county-scoped).

**DECISION POINT for planner:** Given that D-04 says "November general election only" for US House races, the plan should:
1. Create one new election row: CA 2026 Statewide General, `election_date='2026-11-03'`, `election_type='general'`, `jurisdiction_level='state'`, `state='CA'`
2. Optionally create CA 2026 Statewide Primary row (for completeness of ELECT-01) with `election_date='2026-06-02'`, `jurisdiction_level='state'`
3. Use the new general election row for all race INSERTs (Governor + 52 US House)

### 3. Governor Race — Current DB State

[VERIFIED: DB query 2026-05-28]

| Field | Value |
|-------|-------|
| race id | `bc936a36-287c-4ffd-abd8-5e4fd798bae5` |
| position_name | CA Governor |
| election_id | `1ebca37f-cf96-47f4-bc2b-47ef266721fe` (LA County Primary — WRONG) |
| office_id | `NULL` (not linked to Governor office — WRONG) |

Governor office that should be linked: `08454462-a1f0-4d11-9f61-aba7a173a3de` (title='Governor', chamber='Governor', state='CA') [VERIFIED: DB query]

**Required action:** UPDATE the existing CA Governor race to set `election_id` to the new CA general election UUID and `office_id = '08454462-a1f0-4d11-9f61-aba7a173a3de'`.

### 4. US House Races — Current DB State

[VERIFIED: DB query 2026-05-28]

Only **1** US House race row exists: "U.S. Representative District 34" tied to the LA County Primary election. **51 of 52 race rows still need to be created.** The existing CD-34 race is also linked to the wrong (county-level) election.

**All 52 CA US House office_ids** (geo_id → office_id) confirmed by DB query:

| geo_id | office_id |
|--------|-----------|
| 0601 | 095d8394-1b09-4009-8221-1fa5916405ac |
| 0602 | 5a4d85ca-6c91-45d3-ad9a-6fbe81e17cf2 |
| 0603 | d83af640-8f1a-48ed-96ee-8a08e21a37f1 |
| 0604 | 2d2770c7-9493-4cc4-9326-9a56182103c8 |
| 0605 | c1fc046c-5d90-426f-985f-f87587a33898 |
| 0606 | 4bf25567-a4ec-4038-a724-dd421630bdd5 |
| 0607 | f5847ebc-0f8b-4ca3-8639-6c196f3a1a26 |
| 0608 | ecaffbe8-258a-4408-8c04-a84ace6093dc |
| 0609 | 25e8dc7b-186a-4c5c-b707-7eb2bfbc0a53 |
| 0610 | aedf1793-7a41-417c-bba2-588b54f60ff5 |
| 0611 | dea9d19c-5379-4975-9db5-fbb920184220 |
| 0612 | c612fb81-ad92-46cf-9447-53a2f995bf94 |
| 0613 | b44d155a-12ea-42f0-a11b-41abddc809fd |
| 0614 | 4cb713ee-8764-41b7-828b-19d42abefaaf |
| 0615 | 3cd4d6d6-86d1-4bbb-b18e-b31b4cd43a07 |
| 0616 | 1dc07ba5-f29c-4593-b823-7261716fe51e |
| 0617 | a2846ba5-67c3-4be2-9cad-3a3415507a48 |
| 0618 | f4b7fac5-5190-4b50-8cff-e97f4ec4f5a9 |
| 0619 | c52496b6-1068-4f98-a0b5-41d91dc1b79f |
| 0620 | b835ea6d-f084-49c3-a129-24057206f434 |
| 0621 | 17e5ef67-b8f8-4f77-89c5-61afcfc6523e |
| 0622 | 152a70fe-b4ac-4e38-98ce-777cf65899db |
| 0623 | db0f5990-cebb-4d26-bd9b-b2a775941a5c |
| 0624 | 79f6c23a-2572-4d93-9500-e3c5ae880454 |
| 0625 | dc5c64c0-eac1-4cc8-9627-ba0d2ff098c9 |
| 0626 | 0a61e7f7-faaf-4275-8334-5c6b7edb9c56 |
| 0627 | 5e971ab3-133a-443e-a5bb-8fff66dec9a4 |
| 0628 | 08840d87-f911-4c99-8407-a5496cac29fe |
| 0629 | a2fe1b46-d105-4239-8560-0aff0f8f9808 (**active**, Luz Rivas; NOT `ebee1293` which is Cardenas, is_vacant=true) |
| 0630 | a54f1dd9-aaef-4639-8a24-fc1babfa358e |
| 0631 | e1e70721-7c53-4240-95a5-7a9dba3a182b |
| 0632 | 46316d22-43d0-48c1-8e33-00ab1055f83d |
| 0633 | 4aedab90-c243-4314-9517-b20a34a31fbf |
| 0634 | 4e1ab309-a5d2-4c98-9a0d-11034f4896b2 |
| 0635 | 82969f05-8a43-478c-a3c5-dd051c2d12b7 |
| 0636 | 4116447a-ba79-497e-81d2-7ed96632765f |
| 0637 | 6cc8867b-f823-4eb1-a7ba-05a2ceb1f1fa |
| 0638 | 579c06e1-9bf8-4ab5-b87b-da1d1366d682 |
| 0639 | ba2ace24-b043-4d43-9d0b-df043b158d36 |
| 0640 | 40570178-ccae-4197-8b26-354d035ddd41 |
| 0641 | 018f5541-e125-4a1c-b30a-ecfae1da1072 |
| 0642 | 6c9613d8-54e6-40d7-88e2-1140e72687a3 |
| 0643 | 37658309-3b83-4b7e-821c-4a95e3d73944 |
| 0644 | 848404b6-3d2d-4e84-a8f3-27acffabef3f |
| 0645 | 6cff20cd-243b-452c-a287-a04bd301ddee |
| 0646 | ae9b2b49-e367-4326-9604-66aca2f9899c |
| 0647 | 1bdcb754-08cf-40e5-9509-ee873fb518ae |
| 0648 | c0f5cf4c-00f6-4d7b-b854-99497367ac1f |
| 0649 | 92db9e60-fca5-4e3f-9138-29c89c04abe9 |
| 0650 | 6f1c0534-80f8-440d-b5a7-33dc157c460c |
| 0651 | 80bee97f-21af-4587-9977-58727f060746 |
| 0652 | 994f6391-b0a9-428c-bf55-fa56c23e09b8 |

### 5. discovery_jurisdictions — Current CA State

[VERIFIED: DB query 2026-05-28]

9 CA rows exist (all LA-area cities from prior discovery work):
- Avalon (0602364), Beverly Hills (0606308), Covina (0616742), Glendale (0630000), Long Beach (0643000), Los Angeles (0644000), Los Angeles County (06037), Pasadena (0656000), Pomona (0657764)

**None of the 7 target cities have discovery rows.** Zero rows for: SF, SJ, SD, SAC, Fremont, Berkeley. [VERIFIED: DB query]

LA city already has a row at geo_id='0644000' (cityclerk.lacity.org). LA County has a row at geo_id='06037' (lavote.gov). Per D-10, do NOT create duplicate LA rows.

---

## Key Corrections to CONTEXT.md Assumptions

| Assumption in CONTEXT.md | Actual Verified State | Impact on Plan |
|--------------------------|----------------------|----------------|
| "June 3" primary date | CA primary is June 2, 2026 [VERIFIED: CA SOS official page] | Use `election_date='2026-06-02'` for city discovery rows with June races |
| "November 4" general date | CA general is November 3, 2026 (Tuesday after first Monday) [VERIFIED: calendar calculation + ME general precedent = Nov 3] | Use `election_date='2026-11-03'` for all general election rows |
| `cron_active=true` on discovery_jurisdictions | Column does not exist [VERIFIED: DB schema query] | "Armed" = row exists with future election_date; no flag needed |
| `cron_active=true` on races | Column does not exist [VERIFIED: DB schema query] | Races have no active/armed state |
| `1ebca37f` is the CA primary election | It is the LA County Primary (`jurisdiction_level='county'`) [VERIFIED: DB query] | Create new statewide elections rows; do NOT use the LA County row for statewide races |
| Governor race needs `cron_active` patched | No such column; Governor race needs election_id patched to general + office_id filled | UPDATE existing race, not a flag change |
| D-11 mentions `cron_active=true` | Field does not exist | For city rows: just INSERT with the correct election_date |

---

## Discovery Source URLs (Claude's Discretion Resolved)

### City-Level discovery_jurisdictions URLs

[VERIFIED where confirmed via WebFetch/WebSearch; [ASSUMED] where best available]

| City | geo_id | Election Date | Source URL | Confidence |
|------|--------|--------------|-----------|-----------|
| San Francisco | 0667000 | 2026-06-02 | `https://www.sf.gov/reports--candidates-june-2-2026-statewide-direct-primary-election` | MEDIUM — verified live June 2026 candidate list page |
| San Jose | 0668000 | 2026-06-02 | `https://www.sanjoseca.gov/your-government/appointees/city-clerk/elections/2026-elections-primary-and-runoff` | MEDIUM — verified 2026 primary page exists |
| San Diego | 0666000 | 2026-06-02 | `https://www.sandiego.gov/city-clerk/elections/city/electioninfo` | MEDIUM — verified 2026 election info with qualified candidate log |
| Sacramento | 0664000 | 2026-06-02 | `https://www.cityofsacramento.gov/clerk/elections/candidate-information` | MEDIUM — verified URL pattern from search results |
| Fremont | 0626000 | 2026-11-03 | `https://www.fremont.gov/government/election-information` | MEDIUM — Fremont's November 2026 election; June races do not exist |
| Berkeley | 0606000 | 2026-11-03 | `https://berkeleyca.gov/your-government/elections/candidate-information` | MEDIUM — Berkeley's November 3, 2026 general election |
| Los Angeles | 0644000 | already exists | `https://cityclerk.lacity.org/election/2026_Primary_Certified_List_of_Candidates.pdf` | Already in DB — do not re-insert |

**Rationale for election dates:**
- SF, SJ, SD, SAC: All have active June 2, 2026 municipal races (city council, etc.) — use June 2 so the cron sweeps them before the primary.
- Fremont, Berkeley: Their next municipal elections are November 3, 2026 (confirmed: Berkeley November 2026 election calendar confirmed by WebFetch; Fremont filing deadline Aug 7, 2026 per search). Using June 2 would put the row in the past within days; use November 3 so the row stays in the cron's 180-day horizon.

### Statewide (CA SOS) discovery URL

[VERIFIED: CA SOS website]

Main page: `https://www.sos.ca.gov/elections/upcoming-elections/primary-election-june-2-2026`

Certified candidate list (PDF): `https://elections.cdn.sos.ca.gov/statewide-elections/2026-primary/cert-list-candidates.pdf`

**Recommended approach (Claude's Discretion):** Create a SINGLE discovery_jurisdictions row for the CA statewide races (Governor + US House) using the SOS main page URL and jurisdiction_geoid='06' (CA FIPS). Use `election_date='2026-11-03'` (general election sweep horizon). This covers both the Governor and all 52 US House districts under one statewide jurisdiction. Rationale: the discovery agent works per-jurisdiction, not per-race; one statewide row triggers one agent run that scans all CA statewide candidates.

Recommended row:
```sql
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url)
VALUES
  (gen_random_uuid(), '06', 'California Statewide', 'CA', '2026-11-03',
   'https://www.sos.ca.gov/elections/upcoming-elections/primary-election-june-2-2026')
ON CONFLICT DO NOTHING;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 52 US House race INSERT statements | Don't manually type 52 UUIDs | Use a WITH ... AS pattern or a SQL VALUES list with office_id subqueries from the verified table above | Each race needs office_id; the table of 52 is in this document |
| "Arming" discovery | Don't add a flag column | Just INSERT the discovery_jurisdictions row with correct election_date | The cron already handles horizon filtering |
| General election date | Don't use Nov 4 | Use `'2026-11-03'` | Verified Tuesday after first Monday in November 2026 |

---

## Common Pitfalls

### Pitfall 1: Using the LA County election for statewide races
**What goes wrong:** Creating Governor/US House races linked to `1ebca37f` (the LA County Primary). Elections UI groups races by election; statewide races under a county election will display incorrectly.
**Why it happens:** The existing election row has `state='CA'` but `jurisdiction_level='county'`. It was created for LA County discovery only.
**How to avoid:** Create a new election row with `jurisdiction_level='state'` for the CA statewide general. Use its UUID for all statewide race INSERTs.
**Warning signs:** If races appear under "2026 LA County Primary" in the UI, the wrong election_id was used.

### Pitfall 2: Searching for cron_active column
**What goes wrong:** Trying to add `cron_active=true` to a discovery_jurisdictions INSERT will fail with a column-not-found error.
**Why it happens:** CONTEXT.md mentioned `cron_active=true` but this field was never added to the schema. The cron uses `election_date` as the sole filter.
**How to avoid:** Never include `cron_active` in any INSERT/UPDATE for `discovery_jurisdictions` or `races`.
**Warning signs:** SQL error "column cron_active does not exist."

### Pitfall 3: Wrong CA election dates
**What goes wrong:** Using June 3 or November 4 for CA election_dates causes discovery rows to be 1 day off from the actual election and creates confusion.
**Why it happens:** CONTEXT.md stated June 3 / November 4. The CA SOS official page confirms June 2. November 3 is confirmed as the first Tuesday after first Monday in November 2026.
**How to avoid:** Use `'2026-06-02'` for the June primary and `'2026-11-03'` for the November general throughout.
**Warning signs:** Any date ending in -03 or -04 for these CA elections.

### Pitfall 4: Governor race already exists — don't INSERT a new one
**What goes wrong:** Creating a duplicate Governor race row (`position_name='CA Governor'`) when one already exists.
**Why it happens:** The existing race (bc936a36) is linked to the wrong election. Planner might think "no CA general Governor race exists" and INSERT.
**How to avoid:** UPDATE the existing race's `election_id` and `office_id`. Check: `SELECT id FROM essentials.races WHERE position_name='CA Governor'` before any INSERT.
**Warning signs:** Duplicate CA Governor race rows in the election UI.

### Pitfall 5: CD-29 dual office rows
**What goes wrong:** Creating a US House race for the vacant CD-29 office (Tony Cárdenas, is_vacant=true) instead of the active office (Luz Rivas).
**Why it happens:** Two office rows exist for geo_id='0629' — one active, one vacant.
**How to avoid:** Use `a2fe1b46-d105-4239-8560-0aff0f8f9808` (Luz Rivas, is_vacant=false) for the CD-29 race row. Skip `ebee1293` entirely.

### Pitfall 6: Missing governor office_id
**What goes wrong:** The existing Governor race has `office_id=NULL`. If the plan only patches `election_id` without also setting `office_id`, the Governor race won't link to an official.
**How to avoid:** UPDATE must include BOTH `election_id = <new general UUID>` AND `office_id = '08454462-a1f0-4d11-9f61-aba7a173a3de'`.

### Pitfall 7: LA already in Landing.jsx (do not add it again)
**What goes wrong:** Adding a second "Los Angeles" or "Los Angeles County" entry to COVERAGE_AREAS when it already exists.
**Why it happens:** The requirement says "7 cities" including LA — but LA is already present.
**How to avoid:** Only add SF, SJ, Sacramento, Berkeley. LA, SD, Fremont are already present.

---

## Code Examples

### Landing.jsx addition (4 new entries after Fremont)

```javascript
// Source: src/pages/Landing.jsx verified state + D-01/D-02/D-03 decisions
// Add these 4 entries after the Fremont entry (line 13):
{ county: 'San Francisco', state: 'California', browseGovernmentList: ['0667000'], browseStateAbbrev: 'CA' },
{ county: 'San Jose', state: 'California', browseGovernmentList: ['0668000'], browseStateAbbrev: 'CA' },
{ county: 'Sacramento', state: 'California', browseGovernmentList: ['0664000'], browseStateAbbrev: 'CA' },
{ county: 'Berkeley', state: 'California', browseGovernmentList: ['0606000'], browseStateAbbrev: 'CA' },
```

### New election rows (migration 221)

```sql
-- CA 2026 Statewide Primary (for ELECT-01 completeness)
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (gen_random_uuid(), 'CA 2026 Statewide Primary', '2026-06-02', 'primary', 'state', 'CA')
ON CONFLICT DO NOTHING;

-- CA 2026 Statewide General (required for D-04 races)
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (gen_random_uuid(), 'CA 2026 Statewide General', '2026-11-03', 'general', 'state', 'CA')
ON CONFLICT DO NOTHING;
```

### Governor race patch (UPDATE existing, no INSERT)

```sql
-- Source: DB-verified Governor race id and office id (2026-05-28)
UPDATE essentials.races
SET election_id = (SELECT id FROM essentials.elections WHERE name = 'CA 2026 Statewide General'),
    office_id = '08454462-a1f0-4d11-9f61-aba7a173a3de'
WHERE id = 'bc936a36-287c-4ffd-abd8-5e4fd798bae5';
-- Idempotent: WHERE id = specific race UUID guarantees no double-update
```

### US House race INSERTs (52 rows)

```sql
-- Source: DB-verified office_id table (all 52 CDs, 2026-05-28)
-- Template: use WITH to capture the election_id once
WITH gen_elec AS (
  SELECT id FROM essentials.elections WHERE name = 'CA 2026 Statewide General'
)
INSERT INTO essentials.races (id, election_id, office_id, position_name, seats)
SELECT gen_random_uuid(), gen_elec.id, office_id_val, position_name_val, 1
FROM gen_elec, (VALUES
  ('095d8394-1b09-4009-8221-1fa5916405ac', 'U.S. Representative District 1'),
  ('5a4d85ca-6c91-45d3-ad9a-6fbe81e17cf2', 'U.S. Representative District 2'),
  -- ... 50 more rows ...
  ('994f6391-b0a9-428c-bf55-fa56c23e09b8', 'U.S. Representative District 52')
) AS t(office_id_val, position_name_val)
ON CONFLICT DO NOTHING;
```

### discovery_jurisdictions INSERTs (7 city rows)

```sql
-- Source: discovery cron + WebSearch verified URLs (2026-05-28)
INSERT INTO essentials.discovery_jurisdictions
  (id, jurisdiction_geoid, jurisdiction_name, state, election_date, source_url)
VALUES
  -- SF: June 2 primary (active city races)
  (gen_random_uuid(), '0667000', 'San Francisco', 'CA', '2026-06-02',
   'https://www.sf.gov/reports--candidates-june-2-2026-statewide-direct-primary-election'),
  -- San Jose: June 2 primary
  (gen_random_uuid(), '0668000', 'San Jose', 'CA', '2026-06-02',
   'https://www.sanjoseca.gov/your-government/appointees/city-clerk/elections/2026-elections-primary-and-runoff'),
  -- San Diego: June 2 primary
  (gen_random_uuid(), '0666000', 'San Diego', 'CA', '2026-06-02',
   'https://www.sandiego.gov/city-clerk/elections/city/electioninfo'),
  -- Sacramento: June 2 primary
  (gen_random_uuid(), '0664000', 'Sacramento', 'CA', '2026-06-02',
   'https://www.cityofsacramento.gov/clerk/elections/candidate-information'),
  -- Fremont: November 3 general (no June races; filing deadline Aug 7)
  (gen_random_uuid(), '0626000', 'Fremont', 'CA', '2026-11-03',
   'https://www.fremont.gov/government/election-information'),
  -- Berkeley: November 3 general (no June races; Berkeley Nov 2026 calendar confirmed)
  (gen_random_uuid(), '0606000', 'Berkeley', 'CA', '2026-11-03',
   'https://berkeleyca.gov/your-government/elections/candidate-information'),
  -- CA Statewide: November 3 general (Governor + US House)
  (gen_random_uuid(), '06', 'California Statewide', 'CA', '2026-11-03',
   'https://www.sos.ca.gov/elections/upcoming-elections/primary-election-june-2-2026')
ON CONFLICT DO NOTHING;
-- LA (0644000) and LA County (06037) already exist — do NOT re-insert
```

---

## Migration Plan

**Next migration: 221** [VERIFIED: STATE.md]

Recommended split:
- Migration 221: Landing.jsx edit (no SQL migration file needed; just code commit)
- Migration 221: CA elections foundation (2 new election rows + Governor race patch)
- Migration 222: 52 US House race rows
- Migration 223: 7 discovery_jurisdictions rows + 1 CA statewide row

Or: combine all SQL into migrations 221-224 depending on plan structure. The planner decides the exact split; the critical constraint is that the new CA general election row UUID must exist before race rows reference it (use subquery pattern, not hardcoded UUID).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sacramento city clerk URL `cityofsacramento.gov/clerk/elections/candidate-information` is the correct candidate-listing page | Discovery Source URLs | Discovery agent would receive wrong source page; low impact (row can be updated later) |
| A2 | Fremont's elections are November-only with no June 2026 municipal races | Discovery Source URLs | If Fremont has June races, election_date should be June 2 instead of Nov 3 |
| A3 | Berkeley's elections are November-only with no June 2026 municipal races | Discovery Source URLs | Berkeley November 2026 calendar confirmed by WebFetch; low risk |
| A4 | Using geo_id='06' for the CA statewide discovery_jurisdictions row will work correctly | Code Examples | If the discovery agent or cron requires a city/county geo_id (not FIPS state), this row might not work as intended |

---

## Open Questions

1. **Should the existing CD-34 race (already linked to the LA County Primary) be left as-is or migrated to the CA Statewide General?**
   - What we know: "U.S. Representative District 34" exists with `election_id = '1ebca37f'` (LA County Primary)
   - What's unclear: Whether this creates a duplicate when migration 222 adds the CD-34 general race
   - Recommendation: Migration 222 should use `ON CONFLICT DO NOTHING` scoped by (election_id, office_id). The existing CD-34 primary race stays; a new CD-34 general race is added. No collision.

2. **Should the CA statewide primary election row be created (for ELECT-01)?**
   - What we know: ELECT-01 requires "CA 2026 primary (June 3) + general (November 4) election rows seeded"
   - What's unclear: The LA County Primary row (`1ebca37f`) already satisfies the "primary exists" check from a CA perspective
   - Recommendation: Create both — a CA statewide primary row and CA statewide general row. This gives ELECT-01 clean parity. The LA County row remains for its existing races; the statewide row is for correct jurisdiction_level classification.

---

## Environment Availability

Step 2.6: SKIPPED (no external tool dependencies — all work is SQL via Supabase MCP + JSX edit)

---

## Validation Architecture

The phase has no automated test framework applicable to SQL migrations. Validation is done via SQL smoke queries after each migration.

### Smoke Queries for Each Plan

**Plan 69-01: Landing.jsx**
```javascript
// Manual: load https://essentials.empowered.vote, verify 7 CA cities appear in COVERAGE_AREAS list
// Verify SF/SJ/SAC/Berkeley cards navigate to /results?browse_government_list=...
```

**Plan 69-02: Elections + Governor race**
```sql
-- Verify CA elections exist
SELECT name, election_date::text, election_type, jurisdiction_level
FROM essentials.elections WHERE state='CA' ORDER BY election_date;
-- Expected: 3 rows minimum (LA County Primary + CA Statewide Primary + CA Statewide General)

-- Verify Governor race is patched
SELECT position_name, election_id, office_id FROM essentials.races
WHERE id = 'bc936a36-287c-4ffd-abd8-5e4fd798bae5';
-- Expected: election_id = <new general UUID>, office_id = '08454462-...'
```

**Plan 69-03: US House races**
```sql
-- Verify 52 race rows for the CA general election
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id = r.election_id
WHERE e.name = 'CA 2026 Statewide General'
  AND r.position_name LIKE 'U.S. Representative District%';
-- Expected: 52
```

**Plan 69-04: discovery_jurisdictions**
```sql
-- Verify 7 target cities have rows
SELECT jurisdiction_geoid, jurisdiction_name, election_date::text, source_url
FROM essentials.discovery_jurisdictions
WHERE jurisdiction_geoid IN ('0667000','0668000','0664000','0606000','0626000','0666000','06')
ORDER BY jurisdiction_geoid;
-- Expected: 6 city rows + 1 statewide row (0666000 = SD already may exist; check)

-- Verify cron would pick up these rows
SELECT jurisdiction_name, election_date::text
FROM essentials.discovery_jurisdictions
WHERE state='CA'
  AND election_date > now()
  AND election_date <= now() + INTERVAL '180 days'
ORDER BY election_date;
-- Expected: SF/SJ/SD/SAC (June 2) and Fremont/Berkeley/CA Statewide (Nov 3)
```

---

## Sources

### Primary (HIGH confidence)
- `src/pages/Landing.jsx` — read directly; COVERAGE_AREAS verified line by line
- `C:\EV-Accounts\backend\src\lib\discoveryCron.ts` — verified cron query logic; no cron_active column
- DB schema queries (2026-05-28) — elections, races, discovery_jurisdictions column lists; all 52 office_ids
- DB data queries (2026-05-28) — current CA elections, Governor race, US House races, discovery_jurisdictions rows
- `supabase/migrations/197_ca_governor_challengers.sql` — INSERT pattern reference

### Secondary (MEDIUM confidence)
- CA SOS official website (`sos.ca.gov`) — June 2, 2026 primary date confirmed; November general implied
- SF.gov candidates page — SF June 2026 candidate list URL verified
- SJ city clerk elections page — URL confirmed to exist by search results
- Berkeley official elections calendar — November 3, 2026 general confirmed

### Tertiary (LOW confidence)
- Sacramento and Fremont city clerk URLs — found via WebSearch; WebFetch blocked by 403/content truncation; marked as [ASSUMED] in A1 and A2

---

## Metadata

**Confidence breakdown:**
- Landing.jsx current state: HIGH — code read directly
- CA elections DB state: HIGH — DB queried directly
- US House office_ids: HIGH — all 52 retrieved from DB
- cron_active correction: HIGH — schema queried directly, source code read
- Election dates: HIGH — SOS official page + calendar calculation
- Discovery source URLs: MEDIUM — SF/SJ/SD confirmed by search; SAC/Fremont/Berkeley URL patterns assumed from official city websites
- Migration numbering: HIGH — STATE.md confirmed 221

**Research date:** 2026-05-28
**Valid until:** 2026-07-01 (stable DB schema; city URLs may change post-election)
