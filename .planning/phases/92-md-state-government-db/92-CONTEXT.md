# Phase 92: MD State Government DB - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the "State of Maryland" government row, 5 constitutional officer chamber scaffolds (Governor, Lieutenant Governor, Attorney General, Comptroller, State Treasurer), and 5 executive officials (Wes Moore, Aruna Miller, Anthony Brown, Brooke Lierman, Dereck Davis) with offices and headshots at 600×750 in Supabase Storage.

This phase is pure DB seeding — no UI changes, no geofence loading (Phase 91), no legislature (Phase 93). Success leaves the full MD executive branch in place so Phase 93 can add the legislative chambers without touching the government row.

</domain>

<decisions>
## Implementation Decisions

### Lieutenant Governor — Standalone Chamber

- **D-01:** Aruna Miller (LG) gets her own standalone chamber (`Lieutenant Governor`) and her own `STATE_EXEC` district — the same modeling pattern used for Governor. MD LG is separately elected statewide and has independent constitutional duties (chairs Board of Public Works). Do NOT model her under the Governor's chamber. This means 5 chambers total, not 4.

### State Treasurer — Seed Politician in Phase 92

- **D-02:** Seed Dereck Davis (MD State Treasurer, elected by General Assembly January 2023) as a politician with office and headshot in this phase. Do not defer to a later phase. This completes the full executive branch in one migration pass, consistent with how ME (migration 169) and OR (migration 223) handled their appointed officials at chamber creation time.
- **D-03:** Dereck Davis is `is_appointed_position=true` on his office (legislature-elected, not voter-elected). His politician row should have `is_appointed=true`.

### Migration Structure (Claude's Discretion — Guidance)

- Two migrations, same as ME (168→169) and OR (222→223):
  - Migration A: government row + 5 chambers
  - Migration B: 5 politicians + offices + back-fill of `office_id` on politicians
- Headshots are sourced and uploaded to Supabase Storage as part of Migration B or as a separate step in the same plan.

### External ID Numbering (Claude's Discretion — Guidance)

- Follow the `-FIPS0001` pattern: `-240001` through `-240005` for the 5 executives (same pattern as ME `-230001..004`).
- Suggested mapping: Moore=-240001, Miller=-240002, Brown=-240003, Lierman=-240004, Davis=-240005.

### Chamber Naming Convention (Claude's Discretion — Guidance)

- Follow the OR pattern (most recent precedent from migration 222): short `name` + state-qualified `name_formal`.
  - Example: `name='Governor'`, `name_formal='Governor of Maryland'`
  - Exception: if legislative chambers are added in Phase 93 with state-prefixed names (like ME), use consistent naming. The researcher should check the CA (migration 189) and OR (migration 222) conventions before finalizing.

### Claude's Discretion

- Exact headshot sources for Moore, Miller, Brown, Lierman, Davis — researcher should check governor.maryland.gov and attorney-general.maryland.gov; Wikipedia is fallback.
- Whether migrations A and B are numbered 269/270 or a different pair — verify actual next free number by listing C:/EV-Accounts/backend/migrations/ before writing.
- Pre-flight assertion structure (verify State of Maryland row does NOT already exist before inserting — unlike CA where a state row pre-existed).
- Smoke test assertions (if any) for Phase 92 — optional since Phase 91 already has a smoke test; researcher can decide if a quick executive-presence query is worth including.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and Roadmap
- `.planning/REQUIREMENTS.md` — MD-GOV-01 (government row + 5 chambers), MD-GOV-02 (4 voter-elected officials + headshots), MD-GOV-06 (headshot coverage); acceptance criteria for Phase 92
- `.planning/ROADMAP.md` §Phase 92 — Success criteria (5 items after D-01 expansion); Phases 93/94 depend on chambers being in place

### Prior State Government Seeding Patterns (read these — they are the template)
- `C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql` — ME chambers migration; pattern for government row + chamber inserts with `WHERE NOT EXISTS` guards; `GENERATED ALWAYS` slug warning
- `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql` — ME executives migration; pattern for `WITH ins_p AS (INSERT ... ON CONFLICT DO NOTHING RETURNING id)` + office insert + `office_id` back-fill
- `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` — OR chambers migration; most recent precedent for short `name` + state-qualified `name_formal` convention; pre-flight assertion pattern

### Location Onboarding Playbook
- `LOCATION-ONBOARDING.md` — Seeding pattern documentation; ME/OR/CA quick reference blocks; headshot sourcing and processing guidelines

### DB Schema (Supabase production — treat all writes as live)
- `essentials.governments` — columns: name, type, state, city, geo_id; no unique constraint on geo_id — guard by name
- `essentials.chambers` — columns: id, name, name_formal, government_id; `slug` is GENERATED ALWAYS — never insert it
- `essentials.districts` — columns: id, district_type, state, geo_id, label, district_id, mtfcc; use `district_type='STATE_EXEC'`, `state='MD'` (uppercase), `geo_id='24'`
- `essentials.politicians` — columns include: full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id, office_id
- `essentials.offices` — columns include: district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical
- `essentials.politician_images` — columns: politician_id, type='default', storage_url

### Headshot Processing (established in memory)
- Crop to 4:5 ratio first, then resize to 600×750 — never stretch directly
- Lanczos resampling, q90
- No superimposed text/graphics on face
- Upload to Supabase Storage; insert `politician_images` row with `type='default'`

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- Two-migration structure: chambers migration (idempotent `WHERE NOT EXISTS`) → officials migration (CTE `ON CONFLICT DO NOTHING RETURNING id` + office insert)
- `office_id` back-fill at end of officials migration: `UPDATE essentials.politicians SET office_id = o.id FROM essentials.offices o WHERE o.politician_id = p.id AND p.external_id BETWEEN -240010 AND -240001 AND p.office_id IS NULL`
- Migration naming: `{N}_md_government_chambers.sql` / `{N+1}_md_state_executives.sql`
- Pre-flight assertion: `DO $$ BEGIN IF (SELECT COUNT(*) FROM essentials.governments WHERE name = 'State of Maryland') <> 0 THEN RAISE EXCEPTION ... END IF; END $$;` — verify row does NOT yet exist before inserting
- `mcp__supabase-local__apply_migration` for SQL migrations; `mcp__supabase-local__execute_sql` for verification queries

### Integration Points
- Phase 93 (MD Legislature) depends on: government row exists + legislative chamber names are known so it can add Maryland Senate / Maryland House of Delegates under the same government_id
- Phase 94 (MD Headshots) depends on: politician_images rows exist for all 5 officials
- Phase 95 (Leonardtown / St. Mary's County) depends on: county geo_id='24037' boundary from Phase 91, NOT on any Phase 92 row
- Phase 96 (MD Elections) depends on: government row exists for linking discovery_jurisdictions

### No Existing MD Code
- No MD-specific migration scripts exist — this is the first MD migration. Follow ME/OR patterns exactly.

</code_context>

<specifics>
## Specific Ideas

- State Treasurer Dereck Davis was elected by the General Assembly in January 2023. He is a Democrat. Double-check his current status and full legal name before inserting (confirm it is "Dereck E. Davis").
- The ROADMAP success criteria originally listed 4 chamber + 4 politicians; Phase 92 now seeds 5 chambers + 5 politicians (D-01 + D-02 expand the scope). This is intentional and was approved in discussion.
- MD FIPS = 24; all state-level districts use `geo_id='24'`, `state='MD'` uppercase.
- The section split check query from Phase 91 is NOT needed for Phase 92 — no government_bodies rows are being created (section split checks are only needed when LOCAL/COUNTY government structures are seeded alongside geofences).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 92-MD State Government DB*
*Context gathered: 2026-06-05*
