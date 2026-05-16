# Architecture: Cambridge, MA + Massachusetts Integration

**Dimension:** Location Onboarding — v5.0 milestone
**Researched:** 2026-05-15
**Overall confidence:** HIGH — all conclusions drawn from direct codebase inspection

---

## How This Document Is Organized

This file answers the seven architecture questions for Cambridge, MA onboarding. Each section states the conclusion first, then the evidence. A build-order diagram and integration matrix close the document.

---

## 1. Government Type Mapping (City Council, School Committee)

**Conclusion: Use `LOCAL` for both Cambridge City Council and School Committee. No new `district_type` value is needed.**

### Evidence

The `district_type` field lives on `essentials.districts` and maps to MTFCC codes in `essentialsService.ts` lines 566-578. The relevant mappings for local government are:

```sql
(gb.mtfcc = 'G4040' AND d.district_type IN ('LOCAL', 'LOCAL_EXEC'))
OR (gb.mtfcc IN ('G4110', 'G4120') AND d.district_type IN ('LOCAL', 'LOCAL_EXEC'))
```

`LOCAL` already covers city councils across all three existing jurisdictions (Monroe County IN, LA County CA, Collin County TX). The migration 088 pattern confirms: every city council office uses `LOCAL` regardless of whether seats are placed (Plano), district-based (McKinney), or at-large (Allen). Cambridge's 9-member at-large STV council is structurally identical to Allen's 6-member at-large council from the schema's perspective.

For School Committee: the existing `SCHOOL` district type (`G5420` MTFCC) is for geofenced unified school districts (unsd layer), not for school board seats that co-occupy the same city boundary. In every existing city with a school committee/board, it has been seeded under `LOCAL` within the city's government row, not as a separate SCHOOL-type entity. Follow that pattern.

**There is no `COUNCIL_MANAGER` district type and none is needed.** The `type` column on `essentials.governments` (not `district_type`) distinguishes `LOCAL` vs `STATE` vs `County`. Cambridge just gets `type = 'LOCAL'` on its government row.

### Cambridge-Specific Office Mapping

| Cambridge Role | DB Pattern | district_type | Notes |
|---|---|---|---|
| City Council Member (9 seats) | `essentials.offices.title = 'City Council Member'` | LOCAL | At-large; no place numbers — use ordinal or simple index |
| School Committee Member (6 seats) | `essentials.offices.title = 'School Committee Member'` | LOCAL | Same chamber pattern; separate chamber row under same government |
| Mayor | `essentials.offices.title = 'Mayor'` | LOCAL | See section 3 for the structural quirk |
| City Manager | `essentials.offices.title = 'City Manager'` | LOCAL | See section 2 for appointed treatment |

---

## 2. City Manager Office (Appointed, Non-Elected)

**Conclusion: Seed the City Manager in `essentials.politicians` with `is_appointed = true` and a corresponding office row with `is_appointed_position = true`. This is the correct and fully supported pattern.**

### Evidence

The `is_appointed_position` column on `essentials.offices` exists exactly for this case. From `audit-is-appointed.ts` line 268:

```
is_elected is derived as NOT COALESCE(o.is_appointed_position, false)
```

From `essentialsService.ts` line 683:
```typescript
is_elected: !row.is_appointed_position,
is_appointed: row.is_appointed ?? false,
```

The `PoliticianFlatRecord` interface exposes both `is_elected` (boolean) and `is_appointed` (boolean) separately to the frontend. The frontend already renders these distinctions.

The City Manager will appear in address-based representative lookups because the office row will be linked to a district row covering Cambridge's city boundary, and the geofence query pulls all politicians attached to matching geofences — it does not filter out appointed positions. This is the intended behavior: residents should see their City Manager in results.

**No schema changes required.** Just set `is_appointed_position = true` on the office row and `is_appointed = true` on the politician row. This is the audit-proven correct pairing.

### Cambridge City Manager Seed Pattern

```sql
INSERT INTO essentials.offices (chamber_id, title, representing_city, representing_state,
  normalized_position_name, seats, partisan_type, is_appointed_position)
VALUES (v_chamber_id, 'City Manager', 'Cambridge', 'MA',
  'City Manager', 1, NULL, true);  -- true = appointed, not elected
```

---

## 3. Mayor Role (Derived from Council, Not Separately Elected)

**Conclusion: Seed the Mayor as a separate office row with `is_appointed_position = true` and a note in the bio/description. Do NOT create a separate election race for Mayor.**

### Rationale

In Cambridge, the Mayor is the council member who received the most first-choice STV votes in the previous council election. The Mayor chairs council sessions but has no additional executive authority (the City Manager has that). The Mayor is:
- Not elected on a separate ballot line
- Not appointed by the council in a formal vote
- Determined by STV vote count ordering after the election

**Best fit in the schema:** Treat Mayor as a derived/ceremonial role. The council member who is currently Mayor should have:
- A `politicians` row (same person) linked to the `City Council Member` office (their actual elected seat)
- A separate `offices` row for `Mayor` with `is_appointed_position = true` (since it is not a direct election)
- The politician row linked to **both** offices via the `politician_id` FK on each office, OR handle it as a separate politician record for the ceremonial role only

**Simpler approach (recommended):** Seed the Mayor as an additional office that shares the same politician. The `politician_id` on the Mayor office row points to the same politician as one of the council member office rows. This is clean and requires no schema changes.

The mayor office row title should be `'Mayor'` with a brief `office_description` noting the STV-derived role to prevent misleading users into thinking it is a directly elected executive position.

**Do not create a separate election race row for Mayor** — there is no Cambridge Mayor ballot line to discover. The discovery agent's domain allowlist for Cambridge should exclude any source that lists "Mayor" as a separate race.

---

## 4. Massachusetts Geofences (TIGER MTFCC Codes)

**Conclusion: MA uses the identical MTFCC mapping as Texas. G5210 = Senate (STATE_UPPER), G5220 = House (STATE_LOWER). The `load-state-tiger-boundaries.ts` script handles MA with a one-line allowlist addition.**

### Evidence

From `load-state-tiger-boundaries.ts` lines 34-39, the current allowlist is:
```typescript
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place']),
  TX: new Set(['cd', 'sldu', 'sldl', 'county']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  IN: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'cousub']),
};
```

MA is not in the allowlist yet. Adding it requires:

```typescript
MA: new Set(['cd', 'sldu', 'sldl']),
```

And optionally `'place'` if city boundary geofences are needed (they are, for Cambridge). So the full MA entry should be:

```typescript
MA: new Set(['cd', 'sldu', 'sldl', 'place']),
```

### MTFCC Codes (from LAYER_DISPATCH, lines 165-232)

| Layer | MTFCC | district_type | Notes |
|---|---|---|---|
| `cd` | G5200 | NATIONAL_LOWER | MA-7 (Ayanna Pressley's district) |
| `sldu` | G5210 | STATE_UPPER | MA Senate (40 districts) |
| `sldl` | G5220 | STATE_LOWER | MA House (160 districts) |
| `place` | G4110 | LOCAL | Cambridge city boundary |

### MA FIPS Code

Massachusetts FIPS state code is `25`. The run command:
```bash
npx tsx scripts/load-state-tiger-boundaries.ts --state MA --fips 25 --layers cd,sldu,sldl,place
```

The FIPS_TO_STATE map (line 70) already includes `'25': 'ma'`, so the round-trip state↔FIPS check passes automatically once MA is added to the allowlist.

### MA-Specific Consideration: Cambridge Is a City Within Middlesex County

Cambridge's Census place GEOID is `2511000` (FIPS: MA state 25 + place code 11000). When the `place` layer is loaded for MA, Cambridge's G4110 boundary will be inserted into `geofence_boundaries`, and the address lookup will match it. This is identical to how Texas cities work.

For Middlesex County itself, load the `county` layer (`G4020`, MTFCC = 'G4020') if Middlesex County government representation is needed. Cambridge is in Middlesex County (FIPS: `25017`). Whether to include county government depends on scope — Middlesex County does not have elected county commissioners in MA (the county government was largely abolished in 1997). **Skip county layer for MA.**

---

## 5. Coverage Area Entry in Landing.jsx

**Conclusion: Cambridge uses the `browseGovernmentList` pattern, identical to Collin County TX. A single COVERAGE_AREAS entry is all that is needed on the frontend.**

### Evidence

The current `COVERAGE_AREAS` array (Landing.jsx lines 8-12):
```javascript
const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGovernmentList: ['0644000', '06037', '0622710'], browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { county: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: [...23 city geo_ids...] },
];
```

Two patterns exist:
1. `address` — single representative address (Monroe County, no geofences loaded yet)
2. `browseGovernmentList` + `browseStateAbbrev` + optional `browseCountyGeoId` — for geofence-backed browsing (LA, TX)

Cambridge should use the `browseGovernmentList` pattern. The entry:

```javascript
{
  county: 'Middlesex County',
  state: 'Massachusetts',
  browseStateAbbrev: 'MA',
  browseGovernmentList: ['2511000'],  // Cambridge place GEOID
  browseCountyGeoId: '25017'         // Middlesex County FIPS (for congressional intersection)
}
```

**Notes on `county` field name:** The label `county` in the object is display-only (used in the UI as the button label and `browse_label` URL param). For Cambridge, showing "Middlesex County, Massachusetts" is reasonable since users may recognize it. Alternatively, "Cambridge" as the label is more direct since it is a single city. Either works — the label is cosmetic.

**`browseCountyGeoId`:** This drives the PostGIS county boundary intersection to find US House members. Middlesex County FIPS `25017` would need a `G4020` boundary loaded for the intersection to work. Since MA county government is largely abolished, consider whether to add county geofence just for congressional lookup (useful) vs. skip it (simpler). The TX pattern shows it is worthwhile — load Middlesex County `G4020` boundary, set `browseCountyGeoId: '25017'`.

---

## 6. Existing Scripts to Reuse

### Directly Reusable Without Modification

| Script | What to reuse | Notes |
|---|---|---|
| `load-state-tiger-boundaries.ts` | All of it, with one-line MA allowlist addition | Add `MA: new Set(['cd', 'sldu', 'sldl', 'place'])` to STATE_LAYER_ALLOWLIST |
| `load-collin-county-boundary.ts` | Pattern for county G4020 load | Use as template for Middlesex County G4020 |
| Migration 087 | Pattern for `governments` seed (state + county + city) | Template: INSERT state government + county government + city government |
| Migration 088 | Pattern for city chambers + offices | Template: one government row + N chamber rows + N office rows per chamber |
| Migration 091-096 | Pattern for politician seeds | Template: politicians with office_id backfill, email_addresses, urls |
| Migration 103 | Pattern for state/federal executives | Template: Governor, Lt. Governor, AG, etc. |
| Migration 108-110 | Pattern for legislative chambers + politicians | Template: Senate chamber, House chamber, 40 senators, 160 reps |
| `apply-*.ts` scripts | Pattern for compass stances | Template: csv-parse + pg Pool + upsert ON CONFLICT DO UPDATE |
| `importCambridge.ts` | Already imports Cambridge treasury data | Budget data import already works; no changes needed for v5.0 |

### Needs New Code

| Need | New Script Required |
|---|---|
| MA TIGER boundary load | Add MA to `STATE_LAYER_ALLOWLIST` in existing script (one line change, not a new script) |
| Cambridge city structure migration | New migration (e.g., `150_cambridge_ma_governments.sql`) |
| Cambridge incumbents migration | New migration (e.g., `151_cambridge_ma_politicians.sql`) |
| MA state officials migration | New migration (e.g., `152_ma_state_officials.sql`) |
| MA state legislature migrations | New migrations for chambers, senators (40), reps (160) |
| Cambridge discovery jurisdiction | New row in `discovery_jurisdictions` (can be a small migration or script) |

### Migration Number

Per STATE.md: "Next migration is 111" — but the list shows migrations up to 149 as of the last update (2026-05-15). Verify the actual next migration number with:
```sql
SELECT max(version) FROM supabase_migrations.schema_migrations;
```
The Cambridge structure migration should be numbered sequentially from whatever is actually next.

---

## 7. Playbook Document Location

**Conclusion: `LOCATION-ONBOARDING.md` and phase templates live in `.planning/` in the essentials repo. Not in a separate `docs/` folder.**

### Rationale

The existing planning structure at `C:\Transparent Motivations\essentials\.planning\` already contains:
- `PROJECT.md` — project definition and validated requirements
- `STATE.md` — running accumulated context
- `ROADMAP.md` — milestone phase structure
- `phases/` — phase plans (15-xx, 18-xx, 19-xx, etc.)
- `milestones/` — milestone summaries
- `research/` — research files (this file)

A new `docs/` folder would scatter documentation across two locations. Playbook documents are planning artifacts and belong in `.planning/`.

**Proposed structure:**
```
.planning/
  LOCATION-ONBOARDING.md          ← the master playbook checklist
  templates/
    phase-template-officials.md   ← seed politicians for a new city
    phase-template-headshots.md   ← headshot pipeline
    phase-template-discovery.md   ← discovery jurisdiction setup
    phase-template-stances.md     ← compass stance research
    phase-template-geofences.md   ← TIGER boundary load
```

The playbook file name `LOCATION-ONBOARDING.md` (already referenced in PROJECT.md requirements) is correct. It should live directly in `.planning/`, not in a subfolder, since it is a first-class project document alongside `PROJECT.md` and `STATE.md`.

Phase templates belong in `.planning/templates/` since they are reusable skeletons, not specific to any single phase.

---

## Build Order

The dependency graph for Cambridge/MA is:

```
Phase A: MA TIGER Boundaries (no blocking deps — can start immediately)
  ├── Add MA to STATE_LAYER_ALLOWLIST in load-state-tiger-boundaries.ts
  ├── Run: --state MA --fips 25 --layers cd,sldu,sldl,place
  └── Load Middlesex County G4020 boundary (for congressional intersection)

Phase B: MA Government DB Foundation (no blocking deps)
  ├── Seed State of Massachusetts government row (type=STATE, geo_id='25')
  ├── Seed Middlesex County government row (type=County, geo_id='25017')
  ├── Seed City of Cambridge government row (type=LOCAL, geo_id='2511000')
  └── Seed MA state legislative chambers (Senate, House)

Phase C: MA + Federal Officials (depends on Phase B + Phase A)
  ├── MA Governor + Lt. Gov + AG + Secretary of State (statewide, STATE_EXEC)
  ├── US Senators (Warren, Markey — NATIONAL_UPPER)
  ├── US House MA-7 (Pressley) ← use TIGER cd layer from Phase A
  ├── MA state senators (40) ← use TIGER sldu layer from Phase A
  └── MA state reps (160) ← use TIGER sldl layer from Phase A

Phase D: Cambridge City Structure (depends on Phase B)
  ├── City Council chamber (9 at-large seats)
  ├── School Committee chamber (6 seats)
  ├── City Manager office (is_appointed_position=true)
  └── Mayor office (is_appointed_position=true, linked to a council member)

Phase E: Cambridge Incumbents (depends on Phase D)
  ├── 9 City Council members (is_incumbent=true, is_active=true)
  ├── 6 School Committee members
  ├── City Manager (appointed)
  └── Mayor (links to existing council member politician)

Phase F: Headshots (depends on Phase E)
  └── 9 council + 6 school committee + City Manager photos at 600x750

Phase G: Landing.jsx Entry (depends on Phase A — needs county boundary loaded)
  └── Add Cambridge/Middlesex entry to COVERAGE_AREAS

Phase H: Discovery Setup (depends on Phase D)
  ├── Seed Cambridge election row (cambridge.gov/elections is the source)
  ├── Seed races for next Cambridge election cycle
  └── Seed discovery_jurisdictions row for Cambridge

Phase I: Compass Stances (depends on Phase E — needs politician IDs)
  └── Research + apply stances for council members (housing, development, transportation priority)

Phase J: Playbook Retrospective (depends on all phases complete)
  └── Update LOCATION-ONBOARDING.md with learnings
```

**Critical path:** A → B → D → E → (F, G, H, I in parallel) → J

**Phases A and B have no dependencies** — either can start immediately after research.

---

## Integration Points Matrix

| Existing System | How Cambridge Uses It | What Changes |
|---|---|---|
| `load-state-tiger-boundaries.ts` | Add MA allowlist entry; run with --state MA --fips 25 | 1-line code change in STATE_LAYER_ALLOWLIST |
| `essentials.geofence_boundaries` | Receives MA sldu/sldl/cd/place boundaries | No schema change; same columns |
| `essentials.districts` | Receives MA STATE_UPPER/STATE_LOWER/NATIONAL_LOWER rows | No schema change |
| `essentials.governments` | Receives State of MA + Middlesex County + City of Cambridge | Standard INSERT |
| `essentials.chambers` | Receives MA Senate + MA House + Cambridge City Council + School Committee + Admin chamber | Standard INSERT |
| `essentials.offices` | Receives all MA/federal/Cambridge office rows | Standard INSERT; `is_appointed_position=true` for City Manager + Mayor |
| `essentials.politicians` | Receives MA officials + Cambridge council/committee members | Standard INSERT with `is_appointed=true` for City Manager |
| `getRepresentativesByAddress` | Works automatically once geofences + districts + offices linked via `district_id` FK | No code change to query |
| `statewideQueryText` in essentialsService | Picks up MA STATE_EXEC + MA NATIONAL_UPPER automatically via `d.state = $1` filter | No code change; state = 'MA' |
| `Landing.jsx COVERAGE_AREAS` | Add Cambridge entry with `browseGovernmentList: ['2511000']` | Small frontend change |
| `essentials.discovery_jurisdictions` | Add Cambridge row | Standard INSERT |
| Migration numbering | Continue sequentially from current max | Verify with DB query before writing migration |

---

## New DB Patterns Required for Cambridge

### 1. At-Large STV Seat Numbering

Cambridge has 9 at-large council seats with no geographic districts and no place numbers. The TX pattern uses "Place 1–8" for Plano. For Cambridge, use positional seat names like `'Council Member Seat 1'` through `'Council Member Seat 9'` OR simply `'City Council Member'` with `seats = 9` on a single office row.

**Recommendation:** Follow the TX cities pattern with individual office rows — one per seat — even for at-large seats. This allows linking individual politician rows to individual offices (required for the `politician_id` FK on offices). Title them `'City Council Member'` uniformly (all 9 seats have the same title under STV — no numbered places). Each gets a unique office row.

### 2. Mayor as Derived Role

The Mayor office row has `is_appointed_position = true` even though the mayor emerged from an elected process (STV). Set `politician_id` on the Mayor office to point to the same politician as one of the 9 City Council Member offices. This creates a dual-office link for one politician, which the schema supports (no unique constraint on `offices.politician_id`).

### 3. MA State Government Row

```sql
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('Commonwealth of Massachusetts', 'STATE', 'MA', '', '25');
```

Note: Massachusetts officially calls itself a "Commonwealth" — use that full name.

---

## Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| district_type mapping (LOCAL for city council) | HIGH | Direct inspection of migrations 088-098, essentialsService.ts |
| is_appointed_position for City Manager | HIGH | Direct inspection of audit-is-appointed.ts, essentialsService.ts |
| Mayor as appointed-position office | MEDIUM | Derived from schema constraints + Cambridge government structure; no direct precedent in existing data for this exact pattern |
| TIGER MTFCC codes for MA | HIGH | load-state-tiger-boundaries.ts LAYER_DISPATCH table + FIPS_TO_STATE map |
| MA allowlist addition (one-line change) | HIGH | Direct inspection of STATE_LAYER_ALLOWLIST code |
| Landing.jsx COVERAGE_AREAS pattern | HIGH | Direct inspection of Landing.jsx + handleCountyClick logic |
| Migration template reuse | HIGH | Direct inspection of migrations 087-110 |
| Cambridge place GEOID (2511000) | MEDIUM | Standard FIPS formula (MA=25, place=11000); verify against TIGER before loading |
| Middlesex County G4020 usefulness | MEDIUM | Pattern established with Collin County; MA county government is largely abolished so county rep lookup has limited scope |
| .planning/ location for playbook | HIGH | Matches existing .planning/ structure and PROJECT.md requirements |

---

## Open Questions for Phase-Level Research

1. **Cambridge election cycle:** Cambridge holds city elections in odd years (2023, 2025, etc.). The next election is November 2025 (already past) or November 2027. Verify whether to seed a past or future election for the discovery pipeline. If 2027, the discovery pipeline will be idle for ~18 months after setup.

2. **Cambridge city website URL structure:** The election authority URL for the discovery agent needs verification. `cambridge.gov/elections` or `cambridgema.gov/elections` — confirm the correct domain before seeding `discovery_jurisdictions`.

3. **Middlesex County G4020:** Confirm whether to load the county boundary. If Cambridge is the only target city in Middlesex County, the county boundary is only needed for US House member intersection. Worth doing for completeness but not strictly required if the `place` boundary (G4110) alone is sufficient for the Cambridge address lookup.

4. **School Committee election status:** Cambridge School Committee is elected, not appointed. Verify the term length and next election cycle before seeding races.

5. **Cambridge GEOID:** Confirm `2511000` against the TIGER 2024 shapefile. The Census place code for Cambridge MA is standard but worth verifying the 7-digit format before migration.
