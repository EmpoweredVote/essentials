# Phase 119: Lynn Deep Seed - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Lynn, MA city government — Mayor + City Council officials + headshots — so that a Lynn address returns a populated LOCAL section. Phase 119 follows the Newton/Somerville deep seed pattern; next migration is 584.

**Primary scope:** Mayor + City Council (geo_id=2537490, G4110)
**Conditional scope:** If researcher finds Lynn has an elected school committee, include it in Phase 119 (same approach as Newton Phase 117). If no school committee exists or it is appointed, exclude it.
**Out of scope:** Stances (Phase 123), geofence load (geo_id=2537490 already in geofence_boundaries from v5.0 — assert, do not reload)

</domain>

<decisions>
## Implementation Decisions

### Headshot Strategy
- **D-01:** If lynnma.gov blocks images (CivicEngage 403 pattern like Newton), document all as gaps and move on — no fallback hunting via campaign sites, LinkedIn, or Ballotpedia. Best-effort coverage per LYNN-02; gaps are honest.
- **D-02:** If lynnma.gov is accessible (like Somerville), probe the standard city CMS URL patterns for each official and upload what returns 200 OK.

### Migration Scope
- **D-03:** Researcher must verify Lynn's actual elected body structure before the planner determines migration count:
  - If Lynn = Mayor + City Council only → 2 migrations (584 city gov + 585 headshots)
  - If Lynn = Mayor + City Council + elected School Committee → 3 migrations (584 city gov + 585 school committee + 586 headshots), following the Newton 578/579/580 three-migration pattern
- **D-04:** Only include bodies that are democratically elected and confirmed by the researcher. Appointed boards are excluded.

### Council Structure
- **D-05:** Researcher verifies council seat count, ward vs. at-large breakdown, and complete councillor roster from lynnma.gov (the official city site). Do not use unverified counts.
- **D-06:** Title format follows MA convention: `'Mayor'` for Mayor, `'City Councilor'` (at-large) or `'City Councilor (Ward N)'` (ward seat). If Lynn uses a different title (e.g., "Alderman"), researcher confirms and planner uses that instead.

### External ID Scheme
- **D-07:** City official external IDs use the geo_id prefix pattern: `-2537490001` (Mayor) through `-2537490NNN` (councillors, in ward-number order then at-large). School committee (if applicable) uses NCES LEAID prefix.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pattern Migrations (primary sources)
- `C:/EV-Accounts/backend/migrations/578_newton_city_government.sql` — Newton city gov pattern (government + chamber + LOCAL_EXEC + LOCAL districts + politician+office blocks + office_id back-fill + post-verification DO block + ledger entry)
- `C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql` — Newton school committee pattern (G5420 geofence INSERT + school government + SCHOOL district + elected members + Mayor ex-officio office row + back-fill excluding Mayor)
- `C:/EV-Accounts/backend/migrations/580_newton_headshots.sql` — Headshots migration pattern (politician_images rows with type='default')
- `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql` — Somerville city gov (most recent applied; same pattern as 578 with Ward 6 President title decision)
- `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql` — Most recent headshot migration pattern

### Phase Research Reference
- `.planning/phases/118-somerville-deep-seed/118-RESEARCH.md` — Complete Somerville research document; contains architectural responsibility map, title conventions, pitfall list, and CMS pattern notes. Researcher should use as template for Lynn research document.
- `.planning/phases/117-newton-deep-seed/117-RESEARCH.md` — Newton research document; CivicEngage 403-block pattern documented here (Newton got 0/33 headshots)

### Planning Docs
- `.planning/ROADMAP.md` §Phase 119 — Phase goal, requirements, success criteria
- `.planning/REQUIREMENTS.md` §LYNN — LYNN-01, LYNN-02 requirement text
- `.planning/STATE.md` — Next migration (584), geo_id=2537490, key MA facts

</canonical_refs>

<code_context>
## Existing Code Insights

### Established Patterns
- **Three-migration wave pattern:** Newton (578/579/580) and Somerville (581/582/583) established the canonical wave structure for MA Tier 3 city deep seeds. Lynn follows the same wave structure.
- **Flat-district council pattern:** All councillors link to a single LOCAL district; ward/seat encoded in the title string. No per-ward geofences. Established by Newton/Worcester/Somerville.
- **G5420 school district geofence:** Inserted directly in school committee migration (no MA TIGER G5420 loader). Uses NCES LEAID as geo_id. Only applies if Lynn has an elected school committee.
- **WHERE NOT EXISTS guard on governments:** essentials.governments has NO unique constraint on geo_id — always guard with `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')`.
- **slug is GENERATED on chambers:** Never include `slug` in INSERT column list for essentials.chambers.
- **Back-fill UPDATE:** Sets politician.office_id via JOIN on offices; must exclude any ex-officio politician external IDs to avoid overwriting their city office_id.

### Integration Points
- essentials.geofence_boundaries → geo_id='2537490' must exist (asserted at start of migration 584, not reloaded)
- essentials.districts → creates LOCAL_EXEC + LOCAL rows tied to geo_id='2537490'; SCHOOL row tied to LEAID if applicable
- essentials.offices → 1 LOCAL_EXEC + N LOCAL + (school committee offices if applicable)
- politician_photos Supabase Storage bucket → headshot uploads; path pattern `{politician_id}-headshot.jpg`
- essentials.politician_images → type='default' (NOT 'headshot'); one row per politician

### Key Schema Values (MA convention)
- governments.state = 'MA' (uppercase)
- districts.state = 'ma' (lowercase)
- offices.representing_state = 'MA' (uppercase)
- Government name format: 'City of Lynn, Massachusetts, US'
- Chamber name_formal format: 'Lynn City Council'

</code_context>

<specifics>
## Specific Ideas

- Researcher should check whether lynnma.gov uses CivicEngage CMS (which causes 403 on images as seen with Newton). If it does, document as all-gap immediately and skip headshot probing.
- If school committee is found: researcher must identify the NCES LEAID for Lynn Public Schools to derive the G5420 geo_id. Pattern: geo_id = LEAID string (e.g., Boston LEAID=2503990 → geo_id='2503990').
- Councillor title: the city of Somerville spells it "Councilor" (American single-L). Verify whether Lynn uses "Councilor" or "Councillor" — use the official city spelling.
- Mayor for Lynn as of 2026: researcher must verify current Mayor name (city elections occurred November 2025 for some MA cities). Do not assume any particular name without verification.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 119-lynn-deep-seed*
*Context gathered: 2026-06-14*
