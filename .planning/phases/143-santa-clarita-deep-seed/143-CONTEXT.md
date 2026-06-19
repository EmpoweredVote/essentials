# Phase 143: Santa Clarita deep-seed - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring Santa Clarita (geo_id `0669088`, G4110 geofence already loaded) to full Tier 1 depth.

**⚠️ Santa Clarita is NOT greenfield.** DB pre-check on 2026-06-19 found it partially
seeded — and *messier* than Long Beach (Phase 142). The milestone Key Facts' "all 15 cities
greenfield (geofence only)" assumption does **not** hold. This phase is therefore
**reconcile + complete + stances**, not a from-scratch build.

**Verified existing DB state (gov id `42164a8f-2e0a-4786-9099-ce36f3f97101`):**
- Government row exists: `'City of Santa Clarita, California, US'` — but `geo_id` is **NULL** (should be `0669088`), `city`/`state` = (null / `CA`)
- **TWO chambers both named `'City Council'`** (slug `santa-clarita-city-council` collides):
  - **Chamber A** — `external_id -200978`, `official_count NULL`: holds 3 offices = 1 `Mayor` (empty), 2 `Council Member` (1 seated: **Cameron Smyth**, pol ext `-700180`). Smyth uses the LB-style reserved negative scheme.
  - **Chamber B** — `external_id 11243`, `official_count 5`: holds 3 `Councilmember` offices, all seated — **Jason Gibbs** (`665692`), **Laurene Weste** (`665693`), **Patsy Ayala** (`665689`). Original source-derived positive scheme.
- Council form: **5-member at-large council, council-manager government, rotational mayor** (mayor selected annually by/from the council — NOT directly elected, unlike LB).
- Roster: **4 of 5 council members seated** across the two duplicate chambers; 5th seat + current mayor designation unknown.
- Headshots: Smyth **0**, Gibbs **2 (dedupe candidate)**, Weste 1, Ayala 1.
- Stances: **0/4 officials have any stances** (the bulk of the remaining work).
- Geofence: `geo_id='0669088'` present (1 row) — assert, do not reload.
- No orphan politicians by `home_jurisdiction_geoid='0669088'`.

**In scope:**
1. Reconcile the duplicate chambers — **keep Chamber B (`11243`), retire Chamber A (`-200978`)**; migrate Cameron Smyth into a seat in B; delete A's empty Mayor + extra offices; normalize titles to `'Councilmember'`; run the `feedback_section_split_check` SQL after.
2. Data hygiene — backfill gov `geo_id='0669088'`; dedupe Gibbs' 2 images to one `type='default'`; back-fill `politicians.office_id` back-links where NULL; set/confirm `chambers.official_count`.
3. Complete the roster to **5 at-large council seats** — seat the missing 5th member (verify identity + 2026 currency; seat if filled, document honestly if vacant). Mark the current **rotational mayor** by title on their existing council seat (no separate Mayor row).
4. Evidence-only compass stances for ALL council members (existing + new), run as the final wave.

**Out of scope:**
- Appointed officers — City Manager, City Clerk, City Treasurer, City Attorney (council-manager form; not directly elected → not on the voter's ballot). Researcher confirms none are directly elected; surface if one unexpectedly is.
- William S. Hart Union HSD / local school district elected boards — deferred (matches CA precedent: school districts separate from city government; LBUSD excluded in Phase 142).
- TIGER geofence load (G4110 `0669088` already present from v7.0 — assert, do not reload).
- Per-seat geofences (council is at-large — no districts; flat single-geo_id pattern).
- Renumbering existing `665xxx` politician external_ids (real source IDs — leave untouched).

</domain>

<decisions>
## Implementation Decisions

### Phase Framing
- **D-01:** Frame Phase 143 as **reconcile + complete + stances**, NOT greenfield. Researcher/planner MUST start from the verified existing DB state above, not a blank slate. Re-seeding from scratch would duplicate offices and collide with existing external_ids — do not do it.

### Chamber Consolidation
- **D-02:** **Keep Chamber B (`external_id 11243`)** as the canonical Santa Clarita City Council — it already has `official_count=5`, the conventional `'Councilmember'` title, and 3 real seated members. **Retire Chamber A (`external_id -200978`)**: migrate Cameron Smyth into a council seat in B, then delete A and its offices (the 2 `Council Member` offices + the empty `Mayor` office).
- **D-03:** **Normalize titles to `'Councilmember'`** (Chamber A used the `'Council Member'` variant). One title format across all 5 seats.
- **D-04:** After consolidation, run the `feedback_section_split_check` SQL to confirm the duplicate-chamber split-section risk is resolved (zero rows = clean).

### Mayor Modeling
- **D-05:** Model the mayor as a **rotating role on a council seat**, not a separate office. Santa Clarita's mayor is one of the 5 councilmembers serving a 1-year rotating term as presiding officer. Mark the current mayor by **title on their existing Councilmember seat** (e.g., `'Mayor'` / `'Mayor (rotating)'`); do NOT create a separate directly-elected Mayor row (would double-count one person). Drop the empty Mayor office from retired Chamber A. Researcher confirms who currently holds the mayoralty (2026).

### Roster Scope
- **D-06:** **Council-only roster = the 5 at-large council seats**, nothing more. Treat City Manager / Clerk / Treasurer / Attorney as appointed (council-manager form) → excluded. Researcher verifies none are directly elected; if one unexpectedly is, surface it before finalizing. (Contrast: LB elected its City Attorney/Prosecutor/Auditor — SC does not.)
- **D-07:** **Seat the missing 5th council member.** Researcher verifies the 5th member's identity and confirms all 5 are the current (post-Nov-2024 / 2026) incumbents; seat if filled, document honestly if vacant. Do not invent an officeholder.

### External ID Scheme
- **D-08:** New/reconciled seats (the 5th member, any additions) use the **reserved `-700xxx` negative range** with a **pre-flight uniqueness query** before assigning. Cameron Smyth keeps `-700180`. **Do NOT renumber** Gibbs (`665692`) / Weste (`665693`) / Ayala (`665689`) — those are real source IDs; churning them risks breaking external mappings for no benefit.

### Stance Research
- **D-09:** Stances run **in-phase, end-to-end, as the final wave** — after structure reconciliation + headshots are settled and independently verifiable. Evidence-only, **one research agent at a time** (rate-limit rule), ALL live compass topics, no default values, honest blank spokes. Largest single piece of work (0 → full for every official).

### Council District Structure
- **D-10:** **At-large, flat single-geo_id pattern** — all 5 council seats share `geo_id=0669088`; no districts, no per-seat geofences. (Santa Clarita elects its council at-large.)

### Locked by milestone Key Facts + playbook (not re-litigated)
- `governments` INSERT/guard via `WHERE NOT EXISTS` (no geo_id unique constraint); `chambers.slug` is GENERATED — never INSERT it.
- Headshots 600×750 (4:5 Lanczos, `press_use`); `politician_images.type='default'`; no fabricated photos; honest gaps documented.
- Stance migrations apply via raw SQL and do NOT register in `schema_migrations` — **on-disk file counter is authoritative; next migration 894**.
- `districts.state='CA'` UPPERCASE for CA (lowercase returns 0 rows).
- Antipartisan: party may be stored, never displayed on profiles.

### Claude's Discretion
- Exact reconciliation SQL ordering (migrate-then-delete vs. relink), the precise mayor title string, and whether the 5th seat is one INSERT or part of a roster-completion migration — planner's call within the decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Docs
- `.planning/ROADMAP.md` §v17.0 / Phase 143 — phase goal, shared per-city success criteria (lines 84–96), milestone Key Facts (lines 35–59)
- `.planning/REQUIREMENTS.md` §SCLR-01 — requirement text + acceptance
- `.planning/STATE.md` — next migration (894), v17.0 Key Facts, Phase 142 completion notes

### Direct Predecessor (read FIRST — same reconcile-not-greenfield shape)
- `.planning/phases/142-long-beach-deep-seed/142-CONTEXT.md` — Long Beach reconcile + complete + stances; nearly identical structure (duplicate chamber, NULL geo_id, image dedupe, office_id back-fill, reserved -700xxx range, stance-as-final-wave). The primary model for this phase.
- `.planning/phases/142-long-beach-deep-seed/142-RESEARCH.md` — research approach for a reconcile-style CA city phase.
- `C:/EV-Accounts/backend/migrations/294_la_wave1_long_beach.sql` — documents the reserved `-700050..-700099` external_id range + idempotent geo_id backfill pattern.

### Playbook (MANDATORY — read before any seeding)
- `LOCATION-ONBOARDING.md` — full playbook. Critical sections for this phase:
  - §California Quick Reference (external-ID collision pre-flight, ArcGIS outSR, districts.state casing)
  - §LA-Area City Stances (v15.0) Quick Reference (stance ledger bypass, **rotational vs directly-elected Mayor**, Clerk/Treasurer exclusion varies, evidence-only / no-defaulting)
  - §Step 1 Government Structure Research, §Step 2 Election System, §Step 4 Headshots

### Pattern Migrations (CA city deep-seed — primary sources)
- `C:/EV-Accounts/backend/migrations/219_sacramento_government_structure.sql` — CA government/chamber/district structure (WHERE NOT EXISTS guards, GENERATED slug, no ON CONFLICT)
- `C:/EV-Accounts/backend/migrations/220_sacramento_officials.sql` — officials + office back-fill pattern
- `C:/EV-Accounts/backend/migrations/212_fremont_headshots.sql` — headshot migration pattern (`politician_images type='default'`)
- `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql` — CA evidence-only stance migration pattern (raw-SQL apply, no ledger entry)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets / Patterns
- **CA city-deep-seed wave pattern:** Sacramento (219/220) + Fremont (210/211/212) = structure → officials → headshots → stances. Santa Clarita reuses this but starts from a partially-seeded, duplicate-chamber base (mirror Phase 142's reconcile-first approach).
- **At-large flat-seat council pattern:** all council seats link to one set of LOCAL districts/offices sharing `geo_id=0669088`; no per-seat geofences. (Like LB's flat pattern but at-large, not by-district.)
- **`feedback_section_split_check` SQL** — run after duplicate-chamber consolidation to confirm zero split-section rows.
- **WHERE NOT EXISTS guard on governments / chambers / districts** — no unique constraints; never use ON CONFLICT on (geo_id) or (geo_id, district_type).
- **`chambers.slug` is GENERATED** — never include in INSERT.
- **Stance apply path:** `mcp__supabase-local execute_sql` (writes to production) from main context, or `psql -f` via `C:/EV-Accounts/backend/.env` DATABASE_URL. Stance migrations do NOT register in `schema_migrations`.

### Integration Points
- `essentials.governments` row `42164a8f-2e0a-4786-9099-ce36f3f97101` (`'City of Santa Clarita, California, US'`) — UPDATE `geo_id='0669088'`
- `essentials.chambers` — 2 rows both `'City Council'`; KEEP `11243`, RETIRE `-200978`
- `essentials.offices` — keep Chamber B's 3 `Councilmember` offices + add 2 more (Smyth migration + 5th seat); delete Chamber A's 3 offices
- `essentials.politicians` — Smyth (`dcf156cb…`, ext `-700180`) relink to Chamber B; Gibbs/Weste/Ayala keep `665xxx`; back-fill any NULL `office_id`
- `essentials.politician_images` — dedupe Gibbs (`434cd9b0…`, 2 rows) to one `type='default'`; new members need 600×750 headshots
- `essentials.geofence_boundaries` — `geo_id='0669088'` (G4110) must exist; assert, do not reload
- `inform.politician_answers` — stance rows (currently 0 for all SC officials)
- Supabase Storage `politician_photos` bucket — headshot uploads for Smyth + 5th member

### Key Schema Values (CA convention)
- `governments.state='CA'` (uppercase), `governments.geo_id='0669088'`
- `districts.state='CA'` (UPPERCASE for CA — lowercase 'ca' returns 0 rows)
- Government name (existing): `'City of Santa Clarita, California, US'`
- Surviving chamber name: `'City Council'` (external_id `11243`)
- Council title (canonical): `'Councilmember'`

</code_context>

<specifics>
## Specific Ideas

- **The 5th council seat is the key roster unknown** — 4 of 5 seated (Smyth, Gibbs, Weste, Ayala). Verify against santaclarita.gov who the 5th member is and that all 5 are current 2026 incumbents (SC held general-municipal elections Nov 2024).
- **Current rotational mayor** — verify which of the 5 councilmembers currently serves as mayor (term rotates annually); mark by title on their seat.
- **Headshot sourcing** — Smyth needs a headshot (0 images); the 5th member will too. Check santaclarita.gov CMS pattern (possible AEM/ArcGIS background-image embedding like Sacramento — use curl+grep, not WebFetch, if so). Gibbs has 2 images → keep the better one as `type='default'`.
- **Title variant cleanup** — Chamber A used `'Council Member'` (space); canonical is `'Councilmember'`. Normalize during migration.

</specifics>

<deferred>
## Deferred Ideas

- **William S. Hart Union High School District** elected board (and any K-8 districts serving Santa Clarita) — out of scope for v17.0; candidate for a future school-board coverage milestone (consistent with the LBUSD deferral in Phase 142).

</deferred>

---

*Phase: 143-santa-clarita-deep-seed*
*Context gathered: 2026-06-19*
