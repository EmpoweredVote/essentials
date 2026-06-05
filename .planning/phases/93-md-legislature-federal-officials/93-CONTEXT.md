# Phase 93: MD Legislature + Federal Officials - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the Maryland General Assembly (2 legislative chambers + 47 senators + 141 delegates) and 10 federal officials (2 US senators + 8 US House reps) with offices linked to correct district boundaries and best-effort headshots uploaded to Supabase Storage at 600×750.

This phase is pure DB seeding — no UI changes, no geofence loading (Phase 91 complete), no local governments (Phase 95). Success leaves all 198 MD legislative and federal officials in place so Phase 96 can seed election rows referencing their offices, and Phase 97/98 can ingest compass stances.

</domain>

<decisions>
## Implementation Decisions

### Multi-Member Delegate District Modeling

- **D-01:** For "whole" SLDL districts (29 districts, e.g., geo_id `24003`), create **3 office rows** all with `title='Delegate'` linked to the same `district_id`. This is a new multi-office-per-district pattern (OR/ME/MA were all 1:1). No positional labels — all 3 offices are titled 'Delegate' because MD does not officially distinguish them.
- **D-02:** For A/B-split districts (12 districts: 2, 7, 9, 11, 12, 30, 34, 35, 37, 43, 44, 47 — only subdistrict rows exist in DB, e.g., `2402A` and `2402B` for District 2): the researcher **must verify from mgaleg.maryland.gov** whether each A/B district elects 2 or 3 delegates total. If 3 delegates (2 subdistrict + 1 at-large from full parent boundary), **add 12 parent `STATE_LOWER` district rows** (e.g., `24002`) in the chambers migration. If 2 delegates, use only the subdistrict rows as-is.
- **D-03:** For A/B/C-split districts (6 districts: 1, 27, 29, 33, 38, 42), each subdistrict already has its own geo_id and elects 1 delegate. Straightforward: 1 office per subdistrict row, `title='Delegate'`.
- **D-04:** DB has 71 SLDL rows. Target is 141 total delegate offices. Math: 29 whole × 3 + 6 A/B/C × 3 + 12 A/B × 2 = 129 (if A/B = 2 delegates) or 141 (if A/B = 3 delegates). Researcher resolves this arithmetic against official roster before planning.

### Headshot Scope

- **D-05:** Headshots are **best-effort inline** during seeding. Phase 93 sources headshots from `mgaleg.maryland.gov` (and fallback sources) alongside politician seeding. If a headshot cannot be sourced or processed during seeding, skip it — Phase 94 enforces 100% coverage. Phase 93 is complete when politicians are seeded and headshots have been attempted.
- **D-06:** Headshot plans are split by chamber: senators headshots first (Plan 93-05 or similar), then delegates headshots (Plan 93-06). This matches the seeding order and keeps failure scope bounded.

### Migration Wave Structure

- **D-07:** 4 seeding migrations in sequence:
  1. Migration 272: MD legislative chambers (Maryland Senate + Maryland House of Delegates); also insert any missing parent `STATE_LOWER` district rows if D-02 requires it
  2. Migration 273: 47 MD state senators + offices (PowerShell generator script, one senator per SLDU district)
  3. Migration 274: 141 MD delegates + offices (PowerShell generator script, multi-office-per-district for whole districts, subdistrict offices for split districts)
  4. Migration 275: 10 federal officials (Van Hollen + Alsobrooks + 8 US House reps) + offices
  5. Headshot processing plans follow as separate plans after all seeding migrations complete
- **D-08:** Migration 272 also handles pre-flight assertions (verify no Maryland Senate / House of Delegates chambers already exist under State of Maryland government before inserting).

### Federal Officials

- **D-09:** US senators and US House reps link to the **existing shared federal chambers** — "U.S. Senate" and "U.S. House of Representatives" under "United States Federal Government" — with `representing_state='MD'`. Do NOT create state-specific federal chambers. This follows CA/OR/ME precedent (confirmed in DB).
- **D-10:** Van Hollen is the senior senator (Chris Van Hollen). Angela Alsobrooks won the 2024 election — she is the junior senator. Researcher confirms current incumbency status for all 10 federal officials before seeding.

### Claude's Discretion

- External ID numbering scheme: follow OR pattern (`-FIPS + chamber_indicator + seq`): senators `-2410001..-2410047`, delegates `-2420001..-2420141`, US senators `-2430001..-2430002`, US House reps `-2440001..-2440008`. Verify no collision with executive IDs `-240001..-240005`.
- MD legislative chamber naming: follow OR short name + state-qualified formal name convention (e.g., `name='Maryland Senate'`, `name_formal='Maryland State Senate'`; `name='Maryland House of Delegates'`, `name_formal='Maryland House of Delegates'`). Researcher should check if a formal name like "Maryland General Assembly Senate" is more accurate.
- Generator script structure: PowerShell generators (same as `generate_or_senate.ps1` / `generate_or_house.ps1`). Geo_id construction for SLDU: `'24' + dist.PadLeft(3,'0')` → `24001..24047`. For SLDL whole districts: `'24' + dist.PadLeft(3,'0')`. For subdistricts: `'24' + dist.PadLeft(2,'0') + letter` (e.g., `2402A`).
- Office `back-fill` (UPDATE politicians SET office_id) at end of each officials migration.
- Smoke test query at end of each migration: count politicians WHERE representing_state = 'MD' AND district_type IN (...).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-GOV-03 (MD Senate chamber + 47 senators), MD-GOV-04 (House of Delegates + 141 delegates + multi-member structure), MD-GOV-05 (2 US senators + 8 US House reps), MD-GOV-06 (headshot coverage); acceptance criteria for Phase 93
- `.planning/ROADMAP.md` §Phase 93 — Success criteria (5 items); Phases 96/97/98 depend on all 198 officials being seeded

### Prior Legislature Seeding Patterns (read these — they are the template)
- `C:/EV-Accounts/backend/migrations/generate_or_senate.ps1` — PowerShell generator for OR senate; template for MD senate generator; note geo_id construction, EscSql function, roster array structure
- `C:/EV-Accounts/backend/migrations/generate_or_house.ps1` — PowerShell generator for OR house (1:1 model); template for MD delegate generator (must adapt for multi-office-per-district)
- `C:/EV-Accounts/backend/migrations/226_or_state_senators.sql` — Generated OR senate migration; shows full CTE pattern with ON CONFLICT DO NOTHING, district lookup, office insert with NOT EXISTS guard
- `C:/EV-Accounts/backend/migrations/227_or_state_house.sql` — Generated OR house migration; same CTE pattern
- `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` — OR chambers migration; naming convention (short + formal), pre-flight assertions, WHERE NOT EXISTS guard; most recent precedent
- `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql` — ME federal officials migration; shows how US senators and US House reps were seeded using shared federal chambers with representing_state; template for Phase 93 migration 275

### Location Onboarding Playbook
- `LOCATION-ONBOARDING.md` — MD section (after Phase 92 update); headshot sourcing patterns; seeding conventions

### DB Schema (Supabase production — treat all writes as live)
- `essentials.districts` — for SLDL multi-member: multiple offices link to same district_id; state='md' (lowercase) for STATE_UPPER/STATE_LOWER, state='MD' (uppercase) for NATIONAL_UPPER/NATIONAL_LOWER
- `essentials.offices` — title='Senator' for senators, title='Delegate' for delegates, title='U.S. Senator' for federal senators, title='U.S. Representative' for House reps; representing_state='MD' on all
- `essentials.chambers` — "U.S. Senate" and "U.S. House of Representatives" already exist under United States Federal Government — do NOT create new federal chambers for MD
- Existing MD chambers (from Phase 92): Governor, Lieutenant Governor, Attorney General, Comptroller, State Treasurer — all under State of Maryland government_id

### MD SLDL District Map (from DB — verified)
- 29 whole districts with numeric geo_ids in SLDL: 3,4,5,6,8,10,13,14,15,16,17,18,19,20,21,22,23,24,25,26,28,31,32,36,39,40,41,45,46 → 3 offices each
- 6 A/B/C districts: 1,27,29,33,38,42 → 1 office per subdistrict (3 total per parent district)
- 12 A/B districts: 2,7,9,11,12,30,34,35,37,43,44,47 → researcher verifies 2 vs 3 delegates each

### Official Roster Sources
- `mgaleg.maryland.gov` — Maryland General Assembly official site; delegate and senator roster; headshot images
- `congress.gov` or official rep sites — US House rep headshots; Van Hollen and Alsobrooks official pages for US senator headshots

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Multi-migration structure: chambers (idempotent WHERE NOT EXISTS) → officials (CTE ON CONFLICT DO NOTHING RETURNING id → office insert)
- `office_id` back-fill at end of officials migration: `UPDATE essentials.politicians SET office_id = o.id FROM essentials.offices o WHERE o.politician_id = p.id AND p.external_id BETWEEN -N AND -M AND p.office_id IS NULL`
- PowerShell generator scripts produce `.sql` files with one CTE block per politician; run generator → apply SQL via mcp__supabase-local__apply_migration
- Pre-flight assertions: `DO $$ BEGIN IF (SELECT COUNT(*) FROM essentials.chambers WHERE name = 'Maryland Senate' AND government_id = (...)) <> 0 THEN RAISE EXCEPTION ... END IF; END $$;`

### New Pattern (Multi-Member District)
- For whole SLDL districts: generator loops 3 times per district with same geo_id but different external_id and politician row. Each loop produces a distinct CTE block (`WITH ins_p AS (INSERT INTO politicians...) INSERT INTO offices...`).
- NOT EXISTS guard on office insert must account for multiple offices per district: guard by `chamber_id` only (not district), or check `politician_id = p.id` specifically — otherwise the 2nd and 3rd office inserts for the same district would be blocked by the 1st.

### Integration Points
- Phase 96 (MD Elections): needs `offices.id` for senators, delegates, and US House reps to create race rows
- Phase 97/98 (Stances): needs `politicians.id` for all 47 senators and 141 delegates
- Phase 94 (Headshot gap-fill): reads `politician_images` for all MD politicians seeded here

### DB State After Phase 92
- `essentials.governments`: State of Maryland row exists (geo_id='24')
- `essentials.chambers`: 5 executive chambers exist; `government_id` for State of Maryland is needed for legislative chamber inserts — retrieve by `WHERE name = 'State of Maryland'`
- `essentials.districts`: 47 SLDU rows (STATE_UPPER, state='md'), 71 SLDL rows (STATE_LOWER, state='md'), 8 NATIONAL_LOWER rows (state='MD'), 1 NATIONAL_UPPER row (state='MD')

</code_context>

<specifics>
## Specific Ideas

- The math discrepancy (129 vs 141 delegates) is the most important pre-planning verification. Researcher must check mgaleg.maryland.gov delegate roster and count exactly which A/B districts have 2 vs 3 delegates before writing migration 274. If A/B districts need parent STATE_LOWER rows, add them in migration 272 (chambers migration) so migration 274 can reference them.
- Angela Alsobrooks replaced Ben Cardin in Jan 2025 — confirm she is now seated and Chris Van Hollen remains the senior senator.
- MD House of Delegates uses "Delegate" not "Representative" — double-check this in office title to avoid OR-style confusion.
- District 1 has subdistricts 1A, 1B, 1C (three subdistricts = 3 delegates, 1 per subdistrict) — straightforward multi-member but via subdistricts not at-large.
- Federal geo_ids in DB: NATIONAL_LOWER = '2401'..'2408' (2-digit state FIPS + 2-digit district); NATIONAL_UPPER = '24' (state FIPS only, `district_id='Maryland'`).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 93-MD Legislature + Federal Officials*
*Context gathered: 2026-06-05*
