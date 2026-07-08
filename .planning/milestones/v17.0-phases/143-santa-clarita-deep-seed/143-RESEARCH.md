# Phase 143: Santa Clarita Deep-Seed — Research

**Researched:** 2026-06-19
**Domain:** CA city government — reconcile + complete + stances (NOT greenfield)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Frame Phase 143 as **reconcile + complete + stances**, NOT greenfield. Start from verified existing DB state. Re-seeding from scratch would duplicate offices and collide with existing external_ids.
- **D-02:** **Keep Chamber B (`external_id 11243`)** as canonical Santa Clarita City Council — retire Chamber A (`external_id -200978`). Migrate Cameron Smyth into Chamber B, delete A's 3 offices + chamber.
- **D-03:** **Normalize titles to `'Councilmember'`** across all 5 seats (Chamber A used `'Council Member'` with a space).
- **D-04:** After consolidation, run `feedback_section_split_check` SQL — confirm 0 rows (zero split-section risk).
- **D-05:** Model the mayor as a **rotating role on a council seat** — no separate Mayor row. Mark the current mayor by title on their existing Councilmember seat. Drop the empty Mayor office from retired Chamber A.
- **D-06:** **Council-only roster = 5 at-large seats** (though SC is mid-CVRA transition to by-district). Appointed City Manager/Clerk/Treasurer/Attorney excluded. Surface if any is unexpectedly elected.
- **D-07:** **Seat the missing 5th council member** — research verifies identity + 2026 currency. Document honestly if any seat is vacant.
- **D-08:** New/reconciled seats use the **reserved `-700xxx` negative range** with pre-flight uniqueness. Cameron Smyth keeps `-700180`. Do NOT renumber `665xxx` IDs.
- **D-09:** Stances run **in-phase, end-to-end, final wave** — evidence-only, one research agent at a time, ALL live compass topics, no default values, honest blank spokes. Applied via raw SQL, not registered in `schema_migrations`.
- **D-10:** **At-large flat single-geo_id pattern** — all 5 seats share `geo_id=0669088`; no per-seat geofences.

### Claude's Discretion

- Exact reconciliation SQL ordering (migrate Smyth into Chamber B then delete Chamber A vs. re-link first).
- Precise mayor title string (e.g., `'Mayor'` or `'Mayor (rotating)'` on the seat).
- Whether district labels should reflect the partial CVRA transition (D1/D3 by-district-elected; D2/D4/D5 at-large holdover) or stay flat-at-large until 2026 election completes the transition.
- Whether the 5th member addition is in the reconcile migration or a separate complete migration.

### Deferred Ideas (OUT OF SCOPE)

- William S. Hart Union High School District elected board — deferred to a future school-board coverage milestone.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCLR-01 | Santa Clarita (geo_id 0669088) deep-seeded — government + roster + headshots + evidence-only stances | Government structure confirmed (council-manager, rotational mayor); full 5-member roster verified against santaclarita.gov 2026-06-19; headshot CMS pattern documented (direct WordPress PNG URLs, HTTP 200 confirmed); stance evidence sources identified; DB reconciliation approach from Phase 142 precedent. |

</phase_requirements>

---

## Summary

Santa Clarita is a **reconcile + complete + stances** phase, not greenfield. The DB pre-check found:
a government row with `geo_id` NULL, two duplicate `'City Council'` chambers, 4 of 5 council members
spread across both chambers, one pre-existing member (Cameron Smyth) who **departed the council in
December 2024**, and 0 stances for any official.

**The 5th member is Bill Miranda** — Smyth departed December 10, 2024 after the CVRA district-election
transition made his position non-continuable. Miranda was appointed to the council in January 2017 and
has served continuously. Smyth (`external_id -700180`) must be modeled as departed/non-incumbent in
Chamber B (office still created for his prior seat, then marked vacant or unlinked), and Miranda
inserted fresh with a new `-700xxx` external_id. The current 5-member roster is: **Laurene Weste**
(Mayor, rotational), **Patsy Ayala** (Mayor Pro Tem, District 1), **Jason Gibbs** (District 3),
**Marsha McLean** (Councilwoman, at-large holdover, term ends 2026), **Bill Miranda** (Councilmember,
at-large holdover, not seeking re-election 2026). All 5 are current as of 2026-06-19.

Headshots for all 5 members are available as direct PNG downloads from `santaclarita.gov`'s WordPress
media server — no AEM/CQ5 CSS extraction needed (unlike Sacramento), no WAF blocking, no auth
required. All 5 URLs return HTTP 200 with image/png content. Smyth has 0 images in DB and needs
to be handled as a departed member (either removed from the active office or marked `is_incumbent=false`
and `is_vacant=true`) — no headshot upload needed for a departed official.

**Primary recommendation:** Three to four migrations: (894) data-hygiene/reconcile (Chamber A
retirement, Smyth departed, geo_id backfill, Gibbs image dedupe), (895) roster completion (Miranda
inserted, 5th seat created in Chamber B, mayor title on Weste's seat), (896) headshots for Miranda
+ fresh images for Smyth's replacement seat, then per-official stance migrations (897+, no ledger
entry). Total 5 officials for stance research.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Chamber consolidation | Database / Storage | — | SQL-only: retire Chamber A, migrate Smyth record, normalize titles |
| Government geo_id backfill | Database / Storage | — | Single UPDATE on governments row |
| Image dedupe (Gibbs 2→1) | Database / Storage | — | DELETE one duplicate `politician_images` row by UUID |
| Smyth departure modeling | Database / Storage | — | UPDATE politicians.is_incumbent=false, is_active=false, or unlink office_id |
| New official seeding (Miranda) | Database / Storage | — | INSERT politician + office using reserved `-700xxx` ext_id |
| Mayor title on Weste seat | Database / Storage | — | UPDATE offices.title WHERE politician_id = Weste.id |
| Headshot upload (Miranda + any gaps) | CDN / Static (Supabase Storage) | Database / Storage | Download PNG from santaclarita.gov/wp-content/uploads, crop 4:5, resize 600×750, INSERT politician_images |
| Stance ingestion | Database / Storage | — | INSERT inform.politician_answers + politician_context, raw SQL, no ledger |
| Routing / geofence | Database / Storage | — | geo_id=0669088 (G4110) already loaded; no new geofence work |

---

## KEY RESEARCH QUESTION 1: Verified Current Roster

**All 5 members verified from `santaclarita.gov/city-council/` on 2026-06-19.** [VERIFIED: santaclarita.gov/city-council]

### Current Council (5 members, as of 2026-06-19)

| Member | Title | District / Seat | DB Status | Term Ends | Notes |
|--------|-------|-----------------|-----------|-----------|-------|
| **Laurene Weste** | Mayor (rotating) | D4 (at-large holdover) | ✅ in DB (665693) | Dec 2026 | 7th mayoral term (Dec 2025–Dec 2026); up for re-election Nov 2026 |
| **Patsy Ayala** | Mayor Pro Tem | District 1 (elected Nov 2024) | ✅ in DB (665689) | Dec 2028 | First district-elected seat; won D1 Nov 5 2024 |
| **Jason Gibbs** | Councilmember | District 3 (unopposed Nov 2024) | ✅ in DB (665692, 2 images → dedupe) | Dec 2028 | Ran unopposed in D3; 2 politician_images rows — dedupe needed |
| **Marsha McLean** | Councilmember | D2 (at-large holdover) | ❌ NOT in DB — must INSERT | Dec 2026 | Not seeking re-election; joined council 2002; confirmed on santaclarita.gov city council page |
| **Bill Miranda** | Councilmember | D5 (at-large holdover) | ❌ NOT in DB — must INSERT | Dec 2026 | Smyth's replacement as Mayor Dec 2024→Dec 2025; not seeking re-election (age 83); confirmed on santaclarita.gov |

### Cameron Smyth — DEPARTED

- **Cameron Smyth** (DB external_id `-700180`, politician id `dcf156cb-919b-4ca6-93ef-70fd6767f77c`) **left the council December 10, 2024**. He could not run in the CVRA district election because he resided in a district not up for election at that cycle. He delivered a farewell address at the December 10, 2024 council meeting. [VERIFIED: signalscv.com "Smyth bids adieu to City Council, Ayala sworn in"]
- His DB record is in Chamber A (`-200978`) which is being retired. His politician row must be updated to `is_incumbent=false, is_active=false` or have `office_id` nulled when Chamber A is deleted. The office itself should be deleted as part of Chamber A retirement.
- **No headshot needed for Smyth** (he is not a current official; 0 images in DB is acceptable for a departed member).

### District Election Transition Context

Santa Clarita settled a CVRA lawsuit and implemented a 5-district map. The transition is **partial**:
- **Nov 2024**: D1 (Ayala won) and D3 (Gibbs ran unopposed) were the first district-elected seats.
- **Nov 2026**: D2, D4, D5 will be contested for the first time. Until then, the three at-large holdovers (Weste/McLean/Miranda) serve out their at-large terms.
- **DB modeling**: Since all 5 seats still share `geo_id=0669088` (the city geofence — no sub-district geofences exist), use the **flat single-geo_id pattern** per D-10. District label can encode the number (e.g., `'District 1'`, `'District 2'`) for future clarity without requiring new geofence rows. This is Claude's discretion per the decisions above.

[VERIFIED: santaclarita.gov/district-elections, signalscv.com Dec 2025 article]

---

## KEY RESEARCH QUESTION 2: Current Rotational Mayor

**Laurene Weste** was sworn in as Mayor on **December 9, 2025**, beginning her 7th mayoral term. [VERIFIED: hometownstation.com "Laurene Weste Sworn In As Santa Clarita Mayor" Dec 2025]

**Patsy Ayala** was selected as Mayor Pro Tem at the same December 9, 2025 reorganization meeting (3 votes: Miranda/Weste/Ayala vs McLean/Gibbs 2 votes for McLean).

**Modeling rule (D-05 locked):** Mark Weste's existing office title as `'Mayor'` (or `'Mayor (rotating)'` — planner's discretion). Do NOT create a separate `LOCAL_EXEC` row. SC is council-manager; the mayor is selected annually from/by the council. This is consistent with the LOCATION-ONBOARDING.md rotational-mayor pattern (Alhambra/Culver/El Segundo/Santa Monica = no separate Mayor office, rotational designation on council seat).

---

## KEY RESEARCH QUESTION 3: Headshot Sources

### CMS Pattern for santaclarita.gov

Santa Clarita uses **WordPress** (NOT AEM/CQ5 like Sacramento). Photos are served from:

```
https://santaclarita.gov/city-council/wp-content/uploads/sites/39/{year}/{month}/{LastFirstname}.png
```

No CSS background-image extraction needed. Standard HTTP GET — no WAF blocking, no auth. Cloudflare CDN serves images but with `Access-Control-Allow-Origin: *` and HTTP 200. [VERIFIED: curl -sI probe 2026-06-19]

### Confirmed URLs (all HTTP 200, image/png)

| Member | URL | File Size | DB Status |
|--------|-----|-----------|-----------|
| **Laurene Weste** | `https://santaclarita.gov/city-council/wp-content/uploads/sites/39/2023/09/LaureneWeste.png` | 254,847 bytes | ✅ in DB (665693, 1 image) — verify quality |
| **Patsy Ayala** | `https://santaclarita.gov/city-council/wp-content/uploads/sites/39/2024/12/PatsyAyala.png` | 208,462 bytes | ✅ in DB (665689, 1 image) — verify quality |
| **Jason Gibbs** | `https://santaclarita.gov/city-council/wp-content/uploads/sites/39/2023/09/JasonGibbs.png` | 227,386 bytes | ✅ in DB (665692, **2 images** → dedupe to 1) |
| **Marsha McLean** | `https://santaclarita.gov/city-council/wp-content/uploads/sites/39/2023/09/MarshaMclean.png` | 252,627 bytes | ❌ NOT in DB — must upload |
| **Bill Miranda** | `https://santaclarita.gov/city-council/wp-content/uploads/sites/39/2023/09/BillMiranda.png` | 249,585 bytes | ❌ NOT in DB — must upload |

**Processing required:** Download PNG (raw size varies ~200–255KB), crop to 4:5 ratio, resize to 600×750 Lanczos q90 JPEG, upload to Supabase Storage `politician_photos` bucket as `{politician_uuid}-headshot.jpg`.

**Ayala image note:** The Ayala PNG was uploaded December 2024 (after she won the Nov 2024 election) — it is a fresh official portrait, likely higher quality than the 2023 uploads. Quality-check all images before committing dedupe/upload decisions.

**Cameron Smyth:** 0 images, departed — no headshot action needed.

---

## KEY RESEARCH QUESTION 4: Form of Government Confirmation

Santa Clarita is a **general-law city** (not a charter city) operating under the **council-manager** form. [VERIFIED: codepublishing.com/CA/SantaClarita/SantaClarita0208 — Chapter 2.08 City Manager; search result confirms council-manager form explicitly]

**Roster scope (D-06 confirmed):**
- **City Manager**: Appointed by council — excluded (not on ballot).
- **City Clerk**: Administrative role — city website lists it under "Administrative Services" / appointed — excluded.
- **City Treasurer**: Administrative/appointed — excluded.
- **City Attorney**: Appointed (no search results indicate an elected City Attorney for Santa Clarita; unlike Long Beach which elects its City Attorney citywide) — excluded.

**Verification note:** No evidence found of any elected executive officer in Santa Clarita beyond the 5-member council. Santa Clarita is a general-law city, not a charter city, so it cannot create unique elected citywide offices like Long Beach (charter city) can. [ASSUMED: explicitly verified council-manager form; City Attorney/Clerk/Treasurer appointed confirmed by structure research; low risk — general-law CA city default]

**Election method:** Plurality (no RCV). Council uses staggered 4-year terms, even-year elections. [VERIFIED: santaclarita.gov/city-clerk/elections; district election page]

---

## KEY RESEARCH QUESTION 5: Reconciliation SQL Approach

### Chamber A Retirement — FK Safety Order

Chamber A (`id 315e67c5`, `external_id -200978`) has:
- 1 office: empty `Mayor` (no politician_id) — safe to DELETE directly
- 1 office: `Council Member` for Cameron Smyth (politician id `dcf156cb`, ext `-700180`, 0 images)
- 1 office: second `Council Member` (appears to be an empty/duplicate office row per CONTEXT.md "2 Council Member offices")

**Safe deletion order:**
1. Update Smyth's politician record first: `is_incumbent=false, is_active=false, office_id=NULL`
   (or keep office_id pointing at the about-to-be-deleted Chamber A office — let CASCADE handle it if FK is cascading, else NULL first)
2. DELETE the 3 Chamber A offices (the 2 `Council Member` rows + 1 `Mayor` row) by `chamber_id = '315e67c5-9fb3-480b-8647-a05a86a0cefd'`
3. DELETE Chamber A chamber row itself

**FK check needed:** Confirm whether `offices.chamber_id` has an ON DELETE CASCADE or ON DELETE RESTRICT FK. If RESTRICT, must delete offices first, then chamber. If CASCADE, chamber DELETE cascades to offices. Based on prior migrations (Phase 142 deleted offices by chamber rename, not direct DELETE), the pattern is: DELETE offices first by `chamber_id`, then DELETE the chamber. [ASSUMED: RESTRICT FK on offices.chamber_id — standard safe assumption; planner should confirm via `\d essentials.offices` schema inspection before writing migration]

**Smyth's politician row:** Keep the politician row (don't DELETE politicians — FK chains from external references, races, etc.). Just mark `is_incumbent=false, is_active=false, office_id=NULL`.

### Chamber B Normalization

Chamber B (`id eeabd028`, `external_id 11243`) already has 3 `Councilmember` offices. After Chamber A retirement:
- Add 2 new offices for McLean and Miranda in Chamber B
- Verify Gibbs/Weste/Ayala offices are correctly linked back via `politicians.office_id`
- Set Chamber B's `official_count = 5`

### Mayor Title Update

After all 5 council members are seated, UPDATE the office title for Weste's seat:
```sql
UPDATE essentials.offices
SET title = 'Mayor'  -- or 'Mayor (rotating)' per planner's discretion
WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = 665693);
```

Do NOT create a separate `LOCAL_EXEC` district or office for the rotational mayor. [VERIFIED: LOCATION-ONBOARDING.md rotational mayor pattern; locked by D-05]

---

## KEY RESEARCH QUESTION 6: Stance Evidence Landscape

Santa Clarita is a conservative-leaning city in LA County. Public record sources for evidence-only stances:

### Primary Evidence Sources

| Source | Type | Coverage |
|--------|------|----------|
| `santaclarita.gov/city-council/city-council-agendas/` | Official city council minutes/agendas | Votes with roll-call, 2017–present |
| `signalscv.com` (The Signal SCV) | Local newspaper covering SC council thoroughly | Policy positions, votes, campaign statements |
| `hometownstation.com` (KHTS AM/FM) | Local radio + news, good SC council coverage | Development, homelessness, housing votes |
| `scvnews.com` | SCV News — general SC coverage | Election results, council votes |

### Topic Evidence Quality (HIGH/MEDIUM/LOW)

| Compass Topic | Evidence Likelihood | Key Evidence |
|--------------|---------------------|--------------|
| `local-immigration` | HIGH | Santa Clarita is the ONLY city in LA County not to be a sanctuary city; May 2018 unanimous vote opposing SB 54; anti-sanctuary-state resolution on record for all council members present at that vote |
| `housing` / `residential-zoning` | HIGH | State Housing Element pressure + multiple ADU votes; Hartwell mixed-use development votes; RHNA compliance disputes — rich roll-call record |
| `homelessness` / `homelessness-response` | HIGH | City homelessness plan 2022; McLean chairs homelessness task force; "enforcement-first" approach visible in news coverage |
| `growth-and-development` | HIGH | Pro-development vs. controlled-growth tension visible across multiple project votes (Saugus Speedway site, Promenade Flats, Hartwell, Old Town Newhall 5-story project) |
| `economic-development` | MEDIUM | Pro-business city; limited roll-call specifics per individual |
| `local-environment` | MEDIUM | Wildfire/drought region; limited specific votes with attribution |
| `abortion` | LOW | City council rarely votes on state/federal social policy |
| `immigration` | MEDIUM | 2018 SB54 vote gives at least one clear data point for all 5 members present |
| `taxes` | LOW | City budget votes may have attribution but thin record for individual positions |
| Judicial topics | NOT APPLICABLE | No City Attorney/Prosecutor in scope — 0 judicial topic rows expected |

**Thin-record risk:** Ayala (sworn in December 2024, ~6 months in office as of research date) and Miranda/McLean as at-large holdovers may have thinner recent roll-call records. Research agents should aim for 18–21+ stances per official where record exists; honest blank spokes for topics with no attributable evidence.

**2018 SB54 vote is a key anchor:** "All five council members approved a motion to draft a brief in support of the federal government's lawsuit against the state of California for Senate Bill 54" — this gives a `local-immigration` data point for ALL members seated at that vote. Weste, McLean, Miranda were present (Gibbs was not yet on council in 2018; Ayala was not yet on council). Use cautiously — check which specific members were on the council in May 2018 before attributing values.

---

## Migration Plan Shape

### Next migration: 894 [VERIFIED: STATE.md + on-disk counter]

Stance migrations do NOT register in `supabase_migrations.schema_migrations`. On-disk counter is authoritative.

### Recommended Migration Sequence

#### Migration 894 — Data Hygiene / Reconcile

Applied via `schema_migrations` ledger (structural change):

1. `UPDATE essentials.governments SET geo_id='0669088' WHERE id='42164a8f-...' AND geo_id IS NULL` — backfill NULL geo_id
2. UPDATE Smyth politician: `is_incumbent=false, is_active=false, office_id=NULL` (mark departed)
3. DELETE Chamber A's 3 offices: `DELETE FROM essentials.offices WHERE chamber_id = '315e67c5-...'`
4. DELETE Chamber A: `DELETE FROM essentials.chambers WHERE id = '315e67c5-...'`
5. Dedupe Gibbs images: DELETE the lower-priority duplicate `politician_images` row for `434cd9b0-ce80-42fd-b71d-f221349e33f5` (external_id 665692, has 2 rows — keep 1)
6. Back-fill `politicians.office_id` for any of Gibbs/Weste/Ayala where NULL
7. Run split-section check SQL after (should return 0 rows)

#### Migration 895 — Roster Completion

Applied via `schema_migrations` ledger (new people + title update):

**Part A: Add Marsha McLean (external_id -700181, next after Smyth's -700180)**
- INSERT politician: `full_name='Marsha McLean'`, `external_id=-700181`
- INSERT office in Chamber B (`eeabd028`), title='Councilmember', `geo_id=0669088` district

**Part B: Add Bill Miranda (external_id -700182)**
- INSERT politician: `full_name='Bill Miranda'`, `external_id=-700182`
- INSERT office in Chamber B, title='Councilmember'

**Part C: Set current Mayor title on Weste's seat**
- UPDATE office title to `'Mayor'` for Weste (external_id 665693)

**Part D: Set Chamber B official_count = 5**
- `UPDATE essentials.chambers SET official_count=5 WHERE id='eeabd028-...'`

**Pre-flight before writing migration 895:**
```sql
-- Confirm -700180 is Smyth (existing), then select next available:
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -700199 AND -700180
ORDER BY external_id;
-- Expect: -700180 = Cameron Smyth; -700181 and -700182 should be empty
```

External IDs recommended: **-700181** (McLean), **-700182** (Miranda). These are the next slots after Smyth's `-700180` in the SC-reserved range. Pre-flight confirms availability.

#### Migration 896 — Headshots for McLean + Miranda

Applied via raw SQL (audit-only, NOT in `schema_migrations`):
- Download `MarshaMclean.png` + `BillMiranda.png` from santaclarita.gov WordPress CDN
- Crop 4:5, resize 600×750 Lanczos q90 JPEG
- Upload to `politician_photos` bucket as `{uuid}-headshot.jpg`
- INSERT `politician_images` rows (`type='default'`, `photo_license='press_use'`)
- UPDATE `photo_origin_url` on both politician rows

Also in this migration: verify/confirm Weste/Ayala/Gibbs image quality and that Gibbs has exactly 1 row after dedupe in 894.

#### Migrations 897–901 — Evidence-Only Stance Migrations

Applied via raw SQL, one per official, NOT registered in `schema_migrations`. 5 officials.

Recommended order (best-evidence officials first):
1. `897_laurene_weste_stances.sql` — longest council tenure (1998–present); rich record
2. `898_marsha_mclean_stances.sql` — 2002–present; similar tenure depth
3. `899_bill_miranda_stances.sql` — 2017–present; solid record
4. `900_jason_gibbs_stances.sql` — 2020–present; moderate record
5. `901_patsy_ayala_stances.sql` — sworn Dec 2024; thin record; honest blanks expected

**Note:** Cameron Smyth is departed — do NOT research or apply stances for Smyth. He is not a current official. 0 stances for a departed council member is correct.

**Total migrations consuming the ledger:** 894 (reconcile), 895 (complete) — both structural. 896 is audit-only (headshots). 897–901 are stance-only (no ledger). MAX(version) in schema_migrations should equal 895 after all migrations are applied.

---

## Standard Stack

### Core (all CA city deep-seed phases)

| Library/Pattern | Purpose | Why Standard |
|-----------------|---------|--------------|
| PostgreSQL / psql | Run migrations | On-disk migration pattern for SC |
| mcp__supabase-local | Execute SQL from main agent (writes to production) | Confirmed working for stance migrations in Phase 142 |
| Supabase Storage | Headshot upload | `politician_photos` bucket; `{uuid}-headshot.jpg` path |
| Python Pillow (PIL) | Crop 4:5 + resize 600×750 Lanczos | Standard image processing pattern [ASSUMED: available] |

### Alternatives

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mcp__supabase-local | psql -f via .env DATABASE_URL | Subagent executors may lack MCP; psql is portable fallback |
| Python Pillow | Any image editor | Pillow is scriptable; manual crop acceptable |
| Direct curl download | WebFetch | Both work; curl preferred for binary PNG download |

---

## Architecture Patterns

### System Architecture Diagram

```
Data flow for Phase 143:

[santaclarita.gov/city-council/]  →  Research Agent  →  Roster verification (5 members)

[santaclarita.gov/wp-content/uploads/sites/39/]
     →  Download PNG (McLean, Miranda)  →  Crop 4:5  →  Resize 600×750
                                           ↓
                                  Supabase Storage (politician_photos)
                                           ↓
                              INSERT politician_images (type='default')

[Research Agent]  →  Evidence-only stance values  →  INSERT inform.politician_answers
                                                   →  INSERT inform.politician_context

[psql / mcp__supabase-local]
  →  Migration 894: Reconcile (retire Chamber A, depart Smyth, backfill geo_id, dedupe images)
  →  Migration 895: Complete (INSERT McLean/Miranda, UPDATE Weste title to Mayor)
  →  Migration 896: Headshots for McLean + Miranda (audit-only, no ledger)
  →  Migrations 897–901: Stances per official (no ledger, sequential)
```

### Recommended Migration File Structure

```
C:/EV-Accounts/backend/migrations/
├── 894_santa_clarita_reconcile.sql     # Chamber A retirement + geo_id backfill (ledger)
├── 895_santa_clarita_complete.sql      # McLean + Miranda insertion + mayor title (ledger)
├── 896_santa_clarita_headshots.sql     # McLean + Miranda headshots (audit-only)
├── 897_laurene_weste_stances.sql       # Mayor — longest tenure (no ledger)
├── 898_marsha_mclean_stances.sql       # Councilmember (no ledger)
├── 899_bill_miranda_stances.sql        # Councilmember (no ledger)
├── 900_jason_gibbs_stances.sql         # Councilmember (no ledger)
└── 901_patsy_ayala_stances.sql         # Councilmember — thin record (no ledger)
```

### Pattern 1: Chamber DELETE (reconcile phase)

```sql
-- Source: Phase 143 reconcile pattern (derived from Phase 142 migration 878)
-- FK-safe order: NULL politician office_id → DELETE offices → DELETE chamber

-- Step 1: Mark Smyth as departed (unlink from about-to-be-deleted office)
UPDATE essentials.politicians
SET is_incumbent = false, is_active = false, office_id = NULL
WHERE external_id = -700180;

-- Step 2: Delete Chamber A's offices (by chamber_id — safer than by id when IDs are known)
DELETE FROM essentials.offices
WHERE chamber_id = '315e67c5-9fb3-480b-8647-a05a86a0cefd';

-- Step 3: Delete Chamber A itself
DELETE FROM essentials.chambers
WHERE id = '315e67c5-9fb3-480b-8647-a05a86a0cefd';
```

### Pattern 2: WHERE NOT EXISTS for new officials (Sacramento pattern)

```sql
-- Source: migration 220_sacramento_officials.sql
-- Insert McLean into Chamber B with WHERE NOT EXISTS guard
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (external_id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_incumbent, is_vacant, source)
  VALUES (-700181, 'Marsha McLean', 'Marsha', 'McLean', NULL, true, false, true, false,
          'santaclarita.gov')
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (district_id, chamber_id, politician_id, title,
                                 representing_state, is_appointed_position, is_vacant)
SELECT
  (SELECT id FROM essentials.districts
   WHERE geo_id='0669088' AND state='CA' AND district_type='LOCAL' LIMIT 1),
  'eeabd028-35b3-4aae-97ec-0fba4c829c00',  -- Chamber B
  p.id, 'Councilmember', 'CA', false, false
FROM ins_p p
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.chamber_id = 'eeabd028-35b3-4aae-97ec-0fba4c829c00'
    AND o.politician_id = p.id
);
```

### Pattern 3: Stance INSERT (SF pattern — same as Phase 142)

```sql
-- Source: migration 216_sf_officials_stances.sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('{weste_uuid}', '669cac97-66a6-4087-b036-936fbe62efb3', 4.0)  -- housing, restrictive
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('{weste_uuid}', '669cac97-66a6-4087-b036-936fbe62efb3',
        $$Plain-language reasoning with citation...$$,
        ARRAY['https://santaclarita.gov/...', 'https://signalscv.com/...']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```

### Anti-Patterns to Avoid

- **Re-seeding government row:** It already exists — UPDATE geo_id only, never re-INSERT.
- **Inserting slug in chamber INSERT/UPDATE:** `slug` is a GENERATED column — omit from all writes.
- **Parallel stance research agents:** Rate-limit burn, unusable output. One at a time.
- **Stance migrations in schema_migrations ledger:** They don't register — on-disk counter is authoritative.
- **Using retired topic IDs:** Six IDs are `is_live=false` — never use `a9f53bc4`, `45ca4740`, `f2a62698`, `83eeb217`, `be60844f`, `c6957429`.
- **Creating a separate LOCAL_EXEC Mayor row:** SC is rotational — mayor title goes on the existing council seat only (D-05 locked).
- **Researching Smyth stances:** He departed December 2024 and is not an active official. Do not insert any stances for him.
- **Seating City Manager/Clerk/Treasurer/Attorney:** All appointed under general-law council-manager form. None are elected.
- **At-large vs. by-district geofence explosion:** SC is mid-CVRA transition but all 5 seats still share geo_id=0669088. Do NOT create per-district geofences.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotent SQL guards | TRUNCATE + full re-insert | WHERE NOT EXISTS + ON CONFLICT DO NOTHING | Existing politicians/offices have FK dependencies |
| Stance topic ID lookup | In-memory dict | Use UUIDs from Phase 142 RESEARCH.md / migration 216 | Six retired IDs could silently corrupt data |
| Image cropping | Manual editor | Python Pillow + Lanczos | Consistent 600×750 4:5 ratio requirement |
| Headshot downloads | Browser automation | Direct curl / WebFetch | santaclarita.gov WordPress CDN is directly accessible (HTTP 200 confirmed) |
| Chamber slug management | Manual slug string | Omit from INSERT/UPDATE — GENERATED column | Including slug throws PostgreSQL error |

---

## Live Compass Topic IDs (carry from Phase 142 RESEARCH.md)

The complete topic UUID table from Phase 142 RESEARCH.md applies unchanged to this phase. Key notes:
- **Retired IDs never to use:** `a9f53bc4` (housing old), `45ca4740` (taxes old), `f2a62698` (AI old), `83eeb217` (deportation old), `be60844f` (healthcare old), `c6957429` (immigration old)
- **Use these:**
  - `housing`: `669cac97-66a6-4087-b036-936fbe62efb3`
  - `taxes`: `f7e5678d-dadd-4556-a2fc-446e24642ceb`
  - `immigration`: `4e2c69ce-591e-4197-9cd5-7aceff79d390`
  - `healthcare`: `e8dad4a8-eb93-4931-91f5-d8fb5d7dd529`
  - `local-immigration`: `b9ccee94-ad96-4f10-b655-889d8e5abe92`
  - All others: see Phase 142 RESEARCH.md `## KEY RESEARCH QUESTION 5` topic table
- **Judicial topics NOT APPLICABLE:** Santa Clarita has no elected City Attorney or Prosecutor — judicial compass topics do not apply here (unlike Long Beach Phase 142).

---

## Common Pitfalls

### Pitfall 1: Smyth Treated as Active Official

**What goes wrong:** Migration inserts Smyth into Chamber B as a 5th active member, or stance research agent researches him.
**Why it happens:** Smyth is in the DB with a politician record; it's easy to assume "4 in DB + 1 missing = insert the 5th missing one."
**How to avoid:** Smyth's DEPARTURE is the key reconcile fact. The true 5th missing member is **Marsha McLean** (not in DB at all). Miranda is also missing. The DB has Weste/Ayala/Gibbs from Chamber B (3) and Smyth from Chamber A (1). The current active council has 5 different people: Weste/Ayala/Gibbs/McLean/Miranda.
**Warning signs:** Any plan task that says "seat Cameron Smyth in Chamber B" is wrong.

### Pitfall 2: Chamber DELETE Fails on FK Constraint

**What goes wrong:** `DELETE FROM essentials.chambers WHERE id='315e67c5...'` fails with FK violation because offices still reference it.
**Why it happens:** `offices.chamber_id` has a FK constraint. If it's RESTRICT, deleting the chamber before its offices throws an error.
**How to avoid:** Always delete offices first (scoped by `chamber_id`), then delete the chamber. NULL `politicians.office_id` for Smyth before deleting his office row.
**Warning signs:** `ERROR: insert or update on table "offices" violates foreign key constraint` or `ERROR: update or delete on table "chambers" violates foreign key constraint`.

### Pitfall 3: District Row Confusion (5 seats, 1 geo_id)

**What goes wrong:** Planner creates separate `essentials.districts` rows per seat, or per district number (D1–D5), instead of using the existing shared `geo_id=0669088` LOCAL districts.
**Why it happens:** SC's CVRA transition to numbered districts sounds like "per-district geofences needed."
**How to avoid:** D-10 locks the flat single-geo_id pattern. There are no sub-city geofences for SC's 5 districts — all share `geo_id=0669088`. The district number can be encoded in office title or district label, but no new geofence rows are created. Pre-flight: query `SELECT * FROM essentials.districts WHERE geo_id='0669088' AND state='CA'` to see what LOCAL district rows already exist — reuse them.
**Warning signs:** Any INSERT into `essentials.geofence_boundaries` or creation of districts with new geo_ids like `0669088-d1` is wrong.

### Pitfall 4: Mayor Row Modeled as LOCAL_EXEC

**What goes wrong:** Plan creates a new `LOCAL_EXEC` district + office + chamber for the mayor, matching the Long Beach pattern.
**Why it happens:** Long Beach has a directly-elected Mayor (LOCAL_EXEC). Phase 143 researcher/planner reads Phase 142 too literally.
**How to avoid:** SC is **council-manager with rotational mayor** — the mayor is selected annually from within the 5 council seats. Per D-05, set the mayor's title on their existing council seat. Zero new districts/chambers/offices for the mayor role. Per LOCATION-ONBOARDING.md: "Rotational (Alhambra/Culver/El Segundo/Santa Monica/South Gate/WeHo): no Mayor office, all 'Council Member'/'Councilmember'."
**Warning signs:** Any `district_type='LOCAL_EXEC'` in SC migrations is wrong.

### Pitfall 5: External ID Range Collision on New Insertions

**What goes wrong:** External_ids -700181 or -700182 are already taken by a different CA politician inserted in a previous phase.
**Why it happens:** Multiple phases share the same `-700xxx` CA reservation range; Phase 142 used -700050 through -700053.
**How to avoid:** Always run pre-flight query before writing any SC migration:
```sql
SELECT external_id, full_name FROM essentials.politicians
WHERE external_id BETWEEN -700199 AND -700100
ORDER BY external_id;
```
The DB state as of Phase 142 completion shows -700050..-700053 used by LB officials. Smyth is -700180. The range -700181 and up should be free, but confirm before assigning.
**Warning signs:** `ON CONFLICT (external_id) DO NOTHING` silently skips an INSERT — always check RETURNING clause or verify with a SELECT after.

### Pitfall 6: Image Dedupe Deletes Both Gibbs Images

**What goes wrong:** `DELETE FROM politician_images WHERE politician_id = '434cd9b0...'` deletes both rows, leaving Gibbs with no image.
**Why it happens:** Two rows have the same `politician_id` — a bulk-delete by politician_id hits both.
**How to avoid:** Identify the two rows by UUID first: `SELECT id, photo_license, url FROM politician_images WHERE politician_id='434cd9b0...'`. Delete the lower-priority one by specific `id`. Keep `press_use` over `scraped_no_license`; if both same license, keep either.
**Warning signs:** After dedupe, `SELECT COUNT(*) FROM politician_images WHERE politician_id='434cd9b0...'` = 0 means both were deleted — that's wrong; should be 1.

### Pitfall 7: Stance Research Includes Smyth or Excludes McLean/Miranda

**What goes wrong:** Stance batch includes Smyth (departed, 0 stances correct for him) or the planner lists only Weste/Ayala/Gibbs (the 3 originally in Chamber B) as the stance targets.
**Why it happens:** Confusion between "what's in the DB" and "who the current officials are."
**How to avoid:** The 5 stance targets are: Weste, Ayala, Gibbs, McLean (new INSERT in migration 895), Miranda (new INSERT in migration 895). Smyth is departed — no stances. Run stance migrations 897–901 only after migration 895 has confirmed McLean/Miranda politician UUIDs.
**Warning signs:** Stance file references `dcf156cb` (Smyth's UUID) — that's wrong.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | City Clerk, Treasurer, Attorney, Manager are all appointed (not elected) in Santa Clarita | Roster Scope | Low — general-law city confirmed; general-law CA cities cannot elect these officers independently without charter; highly unlikely any are elected |
| A2 | External_ids -700181 and -700182 are unoccupied as of 2026-06-19 | External ID Range | Medium — must pre-flight query before using; low actual risk given Phase 142 used -700050..-700053 and Phase 143 has only -700180 (Smyth) in range |
| A3 | `offices.chamber_id` FK is RESTRICT (not CASCADE) — offices must be deleted before chamber | Reconcile SQL | Medium — if CASCADE, chamber DELETE handles offices automatically; planner should verify via schema inspection before writing migration |
| A4 | McLean and Miranda do not have politician rows elsewhere in the DB (no shared/state-level rows) | Reconcile SQL | Low — they are city council members only; no state/federal politician rows expected; still worth a pre-flight `SELECT full_name FROM politicians WHERE full_name ILIKE '%McLean%' OR full_name ILIKE '%Miranda%' AND full_name ILIKE '%Bill%'` |
| A5 | Python Pillow available for image processing | Standard Stack | Low — any 600×750 4:5 Lanczos crop tool is acceptable |
| A6 | District assignments: Weste=D4, McLean=D2 (or D5), Miranda=D5 (or D2) | Roster | Medium — D4=Weste confirmed from signalscv.com Dec 2025 article; D2/D5 for McLean/Miranda inferred from "D2/D4/D5 are the 2026 election seats" + "Weste is D4"; exact McLean vs Miranda assignment unclear; does NOT affect DB modeling (both share geo_id=0669088 flat-district) |

---

## Open Questions

1. **FK cascade behavior on `offices.chamber_id`**
   - What we know: Deleting Chamber A requires its offices to be gone first OR a CASCADE FK handles it.
   - What's unclear: Whether the FK is RESTRICT or CASCADE.
   - Recommendation: Planner inspects `\d essentials.offices` in the migration preamble comment; writes offices-before-chamber regardless (safe either way).

2. **Which district labels to use for the 5 SC seats**
   - What we know: SC has 5 numbered districts (D1-D5). D1=Ayala, D3=Gibbs are district-elected. D4=Weste. D2/D5 are for McLean/Miranda in some order.
   - What's unclear: Exact D2 vs D5 assignments for McLean/Miranda from available public sources.
   - Recommendation: Use flat `'Councilmember'` title for all non-mayor seats (D-03 locked); encode district numbers in district labels if desired (Claude's discretion). The geo_id=0669088 flat-district pattern means this is cosmetic. Recommend labeling D1–D5 in office title (e.g., `'Councilmember, District 1'`) for display clarity, but this is planner's call.

3. **Should departed Smyth politician row be deleted or just marked inactive?**
   - What we know: Smyth's politician row (`dcf156cb`) has no images, no stances, no race rows (presumably).
   - What's unclear: Whether any `races`/`candidates` rows reference him (pre-v7.0 candidate rows may exist).
   - Recommendation: Mark `is_incumbent=false, is_active=false, office_id=NULL` — never DELETE a politician row. FK risk from any elections/candidates tables is real; marking inactive is the safe pattern consistent with Santa Monica's v15.0 roster reconciliation precedent.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Running SQL migrations | ✓ | 18.1 | mcp__supabase-local execute_sql |
| mcp__supabase-local | Stance migration apply | ✓ | — | psql -f via .env DATABASE_URL |
| santaclarita.gov WordPress CDN | Headshot downloads | ✓ | — | HTTP 200 confirmed; no fallback needed |
| Python Pillow | Image crop/resize | [ASSUMED] | — | Any image editor supporting Lanczos resize |
| Supabase Storage (politician_photos) | Headshot upload | ✓ | — | — |

**Missing dependencies with no fallback:** None identified.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | psql smoke queries (no automated test suite for migration phases) |
| Config file | none — inline verification SQL in migration file headers |
| Quick run command | `SELECT COUNT(*) FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.external_id='11243'` |
| Full suite command | Per-migration verification queries listed below |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Wave |
|--------|----------|-----------|-------------------|------|
| SCLR-01 | Government row has geo_id='0669088' | smoke | `SELECT geo_id FROM essentials.governments WHERE id='42164a8f-2e0a-4786-9099-ce36f3f97101'` | Post-894 |
| SCLR-01 | Only one 'City Council' chamber exists | smoke | `SELECT COUNT(*) FROM essentials.chambers WHERE government_id='42164a8f-...' AND name='City Council'` → should be 1 | Post-894 |
| SCLR-01 | Chamber A deleted | smoke | `SELECT COUNT(*) FROM essentials.chambers WHERE external_id='-200978'` → 0 | Post-894 |
| SCLR-01 | All 5 officials seated in Chamber B | smoke | `SELECT p.full_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id=p.id WHERE o.chamber_id='eeabd028-...'` → 5 rows | Post-895 |
| SCLR-01 | Weste's office title = 'Mayor' | smoke | `SELECT o.title FROM essentials.offices o JOIN essentials.politicians p ON o.politician_id=p.id WHERE p.external_id=665693` → 'Mayor' | Post-895 |
| SCLR-01 | All 5 active officials have ≥1 headshot | smoke | `SELECT p.full_name FROM essentials.politicians p LEFT JOIN essentials.politician_images pi ON pi.politician_id=p.id WHERE pi.id IS NULL AND p.external_id IN (665693,665689,665692,-700181,-700182)` → 0 rows | Post-896 |
| SCLR-01 | Gibbs has exactly 1 image row | smoke | `SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id='434cd9b0-...'` → 1 | Post-894 |
| SCLR-01 | All 5 active officials have ≥1 stance | smoke | `SELECT COUNT(DISTINCT politician_id) FROM inform.politician_answers WHERE politician_id IN (SELECT id FROM essentials.politicians WHERE external_id IN (665693,665689,665692,-700181,-700182))` → 5 | Post-901 |
| SCLR-01 | No split-section (zero duplicate chamber names) | smoke | split-section check SQL → 0 rows | Post-894 |
| SCLR-01 | Smyth marked inactive (not an active official) | smoke | `SELECT is_incumbent,is_active FROM essentials.politicians WHERE external_id=-700180` → false,false | Post-894 |

### Sampling Rate

- **Per migration:** Verification SQL in migration header comments
- **Per wave merge:** Full smoke suite (all 10 queries above)
- **Phase gate:** All 10 smoke queries return expected results before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure (psql inline verification) covers all phase requirements. No new test files needed.

---

## Security Domain

> This phase is database seeding only — no authentication changes, no new API endpoints.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Partial | SQL uses parameterized UUIDs (gen_random_uuid()); stance reasoning text uses $$dollar-quoting$$ |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via stance reasoning text | Tampering | Use `$$dollar-quoting$$` for multi-line text literals (SF migration 216 pattern) |
| Accidental production write | Tampering | mcp__supabase-local IS production — confirm writes intentional before execute_sql |
| Wrong Chamber A deleted (ID mismatch) | Tampering | Always target Chamber A by its UUID `315e67c5-...`, never by `name='City Council'` (both chambers share that name) |

---

## Sources

### Primary (HIGH confidence)

- [VERIFIED: santaclarita.gov/city-council] — Current 5-member roster confirmed 2026-06-19: Weste (Mayor), Ayala (Mayor Pro Tem), McLean, Gibbs, Miranda
- [VERIFIED: santaclarita.gov/city-council/laurene-weste] — Weste confirmed as current Mayor, 7th term (2025)
- [VERIFIED: hometownstation.com "Laurene Weste Sworn In" Dec 9 2025] — Swearing-in date + Ayala selected Mayor Pro Tem
- [VERIFIED: santaclarita.gov/district-elections] — CVRA transition to 5 districts; D1/D3 elected Nov 2024; D2/D4/D5 elected Nov 2026
- [VERIFIED: signalscv.com Dec 2025 "Election year is nigh"] — Weste=D4; Miranda/McLean not seeking re-election; D2/D4/D5 are 2026 ballot districts
- [VERIFIED: signalscv.com Dec 2024 "Smyth bids adieu"] — Cameron Smyth departed December 10, 2024; Bill Miranda appointed as Mayor (Dec 2024–Dec 2025)
- [VERIFIED: curl -sI probe 2026-06-19] — All 5 santaclarita.gov WordPress headshot URLs return HTTP 200 image/png with expected byte sizes
- [VERIFIED: STATE.md] — Next migration counter = 894
- [VERIFIED: migration 878_long_beach_reconcile.sql] — FK-safe chamber DELETE pattern (offices before chamber)
- [VERIFIED: migration 879_long_beach_complete.sql] — INSERT politician + office + back-fill office_id pattern
- [VERIFIED: migration 216_sf_officials_stances.sql] — Stance INSERT pattern (ON CONFLICT DO UPDATE)
- [VERIFIED: 142-RESEARCH.md topic UUID table] — Live compass topic IDs (same milestone, same application)

### Secondary (MEDIUM confidence)

- [CITED: hometownstation.com "Santa Clarita City Council Votes To Oppose Sanctuary State Law"] — May 2018 unanimous SB54 vote; confirms local-immigration stance evidence anchor
- [CITED: hometownstation.com "Santa Clarita Council Faces Backlash Over Hartwell / ADU"] — Housing/development votes 2025; stances evidence for housing/residential-zoning
- [CITED: codepublishing.com/CA/SantaClarita SantaClarita0208] — Chapter 2.08 City Manager confirms council-manager form

### Tertiary (LOW confidence)

- [ASSUMED] City Clerk/Treasurer/Attorney all appointed — inferred from general-law council-manager form; no specific charter document retrieved confirming these positions are not elected. Low risk given CA general-law city defaults.
- [ASSUMED] McLean=D2, Miranda=D5 (or vice versa) — D4=Weste confirmed; D2/D5 split inferred but not sourced with attribution. Does not affect DB modeling (both share geo_id=0669088).

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — psql + mcp__supabase-local + WordPress CDN all verified
- Architecture: HIGH — all UUID values DB-verified from CONTEXT.md; migration patterns from Phase 142 precedent
- Roster: HIGH — direct santaclarita.gov scrape; Smyth departure confirmed from Signal news
- Mayor identification: HIGH — hometownstation.com article from December 9, 2025
- Headshots: HIGH — all 5 URLs HTTP 200 confirmed via curl probe
- Stance evidence: MEDIUM — Signal/KHTS sources identified; specific per-vote attribution requires agent research
- Form of government: HIGH — council-manager confirmed; appointed roles confirmed

**Research date:** 2026-06-19
**Valid until:** 2026-11-30 (roster changes expected after November 2026 election when D2/D4/D5 seats are contested; Weste/McLean/Miranda not seeking re-election)
