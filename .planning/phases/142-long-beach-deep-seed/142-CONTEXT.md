# Phase 142: Long Beach deep-seed - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring Long Beach (geo_id `0643000`, G4110 geofence already loaded) to full Tier 1 depth.

**⚠️ Long Beach is NOT greenfield.** DB pre-check on 2026-06-19 found it was already
seeded in v7.0 and gap-filled by migration 294 (2026-06-08). The milestone Key Facts'
"all 15 cities greenfield (geofence only)" assumption does **not** hold for Long Beach.
This phase is therefore **reconcile + complete + stances**, not a from-scratch build.

**Verified existing DB state (gov id `5e5c3e0b-5479-4759-ac7e-2ea0aecabd38`):**
- Government row exists: `'City of Long Beach, California, US'` — but `geo_id` is **NULL** (should be `0643000`)
- **TWO chambers both named `'Long Beach City Council'`** — one holds the Mayor (1 LOCAL_EXEC office), one holds council (8 LOCAL offices). Duplicate `name_formal` = split-section risk.
- Mayor: Rex Richardson seated (`external_id -200813`) — but `politicians.office_id` back-link is NULL
- Council: **8 of 9 districts seated** (`external_id` 665830–665842; title `'Councilmember'`). Long Beach has 9 council districts — one seat is missing.
- Districts: flat — 8 LOCAL + 1 LOCAL_EXEC, all `geo_id=0643000` (no per-district geofences)
- Headshots: **9/9 officials have ≥1 image** (several have 2 → dedupe candidates)
- Stances: **0/9 officials have any stances** (the bulk of the remaining work)
- City Attorney / City Prosecutor / City Auditor: **not seated**

**In scope:**
1. Reconcile existing seed + data hygiene (gov `geo_id` backfill; resolve duplicate "Long Beach City Council" chamber by renaming the Mayor's chamber; dedupe double images; back-fill Rex Richardson `office_id`)
2. Seat the missing 9th council district (verify which district; seat if filled, document if vacant)
3. Add the 3 directly-elected citywide officers — City Attorney, City Prosecutor, City Auditor — as offices + headshots + stances
4. Evidence-only compass stances for ALL officials (existing 9 + new), run as the final wave

**Out of scope:**
- Long Beach Unified School District (LBUSD) elected Board of Education — deferred; separate independent district, not city government (matches CA precedent)
- TIGER geofence load (G4110 `0643000` already present from v7.0 — assert, do not reload)
- Per-district council geofences (existing pattern is flat single-LOCAL)

</domain>

<decisions>
## Implementation Decisions

### Phase Framing
- **D-01:** Frame Phase 142 as **reconcile + complete + stances**, NOT greenfield. Researcher/planner MUST start from the verified existing DB state above, not from a blank slate. Re-seeding from scratch would duplicate offices and collide with existing external_ids — do not do it.

### Roster Scope
- **D-02:** Include all three directly-elected citywide officers — **City Attorney, City Prosecutor, City Auditor**. Unlike SF/Sacramento/Fremont (where these are appointed and excluded), Long Beach elects them citywide; they belong on the ballot the voter sees. Seat them with their own chamber(s)/offices + headshots + stances.
- **D-03:** Seat the **missing 9th council district**. Researcher verifies which district (1–9) is absent and whether it currently has an officeholder or is vacant; seat if filled, document honestly if vacant. Do not invent an officeholder.
- **D-04:** **LBUSD school board out of scope** — city government only. Defer school boards for the whole wave (folding 15 boards balloons the milestone; CA precedent kept school districts separate).

### Stance Research
- **D-05:** Stances run **in-phase, end-to-end, as the final wave** — after structure reconciliation + headshots are settled and independently verifiable. Evidence-only, one research agent at a time (rate-limit rule), ALL live compass topics, no default values, honest blank spokes. This is the largest single piece of work (0 → full for every official).

### Council District Structure
- **D-06:** Keep the **flat single-LOCAL** district pattern already in the DB (all council seats share `geo_id=0643000`; district number encoded in the office title). Do NOT create per-district geofences. Researcher confirms current district→councilmember mapping and the official title format Long Beach uses (existing rows use `'Councilmember'`).

### Data Hygiene (reconciliation tasks)
- **D-07:** Backfill `essentials.governments.geo_id = '0643000'` on the Long Beach gov row (currently NULL).
- **D-08:** Resolve the **duplicate `'Long Beach City Council'` chamber name** — rename the Mayor's chamber (the 1-office LOCAL_EXEC one) to a distinct name (e.g., `'Office of the Mayor of Long Beach'` / `'Mayor of Long Beach'`) to prevent split-section bugs. Run the `feedback_section_split_check` SQL after the fix.
- **D-09:** Dedupe officials with 2 `politician_images` rows down to one `type='default'` (600×750).
- **D-10:** Back-fill `politicians.office_id` for Rex Richardson (bidirectional office link is NULL).

### External ID Scheme
- **D-11:** New Long Beach officials (3 citywide officers + missing 9th council seat) use the **reserved range `-700050 … -700099`** (documented as reserved/unused in migration 294) — NOT the milestone's generic geo_id-prefix scheme. This keeps new rows consistent with the existing Long Beach seed (existing council use positive 665830–665842; Mayor uses -200813). Run a pre-flight uniqueness query before assigning any external_id.

### Milestone-Wide
- **D-12:** This phase's CONTEXT flags a **wave-wide pre-check requirement**: every Wave-2 city phase (143–156) MUST DB-pre-check before assuming greenfield — at least Long Beach and Carson were already seeded. Recommend updating ROADMAP/STATE Key Facts to soften the "all 15 greenfield" claim. (See Deferred Ideas.)

### Locked by milestone Key Facts + playbook (not re-litigated)
- `governments` INSERT/guard via `WHERE NOT EXISTS` (no geo_id unique constraint); `chambers.slug` is GENERATED — never INSERT it
- Headshots 600×750 (4:5 Lanczos, `press_use`); `politician_images.type='default'`; no fabricated photos; honest gaps
- Stance migrations apply via raw SQL and do NOT register in `schema_migrations` — **on-disk file counter is authoritative; next migration 878**
- Long Beach is **plurality** (runoffs), NOT RCV — no `election_method='rcv'`
- Antipartisan: party may be stored, never displayed on profiles

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Docs
- `.planning/ROADMAP.md` §v17.0 / Phase 142 — phase goal, shared success criteria (lines 75–86), milestone Key Facts
- `.planning/REQUIREMENTS.md` §LBCH-01 — requirement text + acceptance
- `.planning/STATE.md` — next migration (878), geo_id `0643000`, v17.0 Key Facts

### Playbook (MANDATORY — read before any seeding)
- `LOCATION-ONBOARDING.md` — full playbook. Critical sections for this phase:
  - §California Quick Reference (CA-specific traps: external-ID collision pre-flight, RCV-at-seed-time, ArcGIS outSR, districts.state casing)
  - §LA-Area City Stances (v15.0) Quick Reference (stance ledger bypass, rotational vs directly-elected Mayor, Clerk/Treasurer exclusion varies, evidence-only/no-defaulting)
  - §Step 1 Government Structure Research, §Step 2 Election System, §Step 4 Headshots

### Pattern Migrations (CA city deep-seed — primary sources)
- `C:/EV-Accounts/backend/migrations/294_la_wave1_long_beach.sql` — **the prior Long Beach gap-fill**; documents the existing 9 incumbents, the reserved `-700050..-700099` external_id range, and idempotent geo_id backfill. Read FIRST — it is the direct predecessor.
- `C:/EV-Accounts/backend/migrations/219_sacramento_government_structure.sql` — CA mayor + by-district council government/chamber/district structure pattern (WHERE NOT EXISTS guards, GENERATED slug, no ON CONFLICT)
- `C:/EV-Accounts/backend/migrations/220_sacramento_officials.sql` — officials + office back-fill pattern
- `C:/EV-Accounts/backend/migrations/212_fremont_headshots.sql` — headshot migration pattern (`politician_images type='default'`)
- `C:/EV-Accounts/backend/migrations/216_sf_officials_stances.sql` — CA evidence-only stance migration pattern (raw-SQL apply, no ledger entry)

### Prior CONTEXT shape (reference only)
- `.planning/phases/119-lynn-deep-seed/119-CONTEXT.md` — most recent city-deep-seed CONTEXT structure (MA conventions differ; use for shape, not for CA specifics)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets / Patterns
- **CA city-deep-seed wave pattern:** Sacramento (219/220) + Fremont (210/211/212) establish structure → officials → headshots → stances. Long Beach reuses this but starts from a partially-seeded base.
- **Flat-district council pattern:** all council seats link to one set of LOCAL districts sharing `geo_id=0643000`; district number encoded in title. Already the Long Beach pattern — preserve it.
- **WHERE NOT EXISTS guard on governments / chambers / districts** — no unique constraints; never use ON CONFLICT on (geo_id) or (geo_id, district_type).
- **`chambers.slug` is GENERATED** — never include in INSERT.
- **Stance apply path:** `mcp__supabase-local execute_sql` (writes to production) from main context, or `psql -f` via `C:/EV-Accounts/backend/.env` DATABASE_URL. Subagent executors may lack MCP → psql is the portable fallback. Stance migrations do NOT register in `schema_migrations`.

### Integration Points
- `essentials.governments` row `5e5c3e0b-5479-4759-ac7e-2ea0aecabd38` (`'City of Long Beach, California, US'`) — UPDATE `geo_id`
- `essentials.chambers` — 2 rows currently both `'Long Beach City Council'`; rename the Mayor (LOCAL_EXEC) one
- `essentials.offices` — 1 LOCAL_EXEC (Mayor) + 8 LOCAL (council); add 9th council + 3 citywide officers
- `essentials.geofence_boundaries` — `geo_id='0643000'` (G4110) must exist; assert, do not reload
- `essentials.politician_images` — `type='default'`; dedupe doubles
- `inform.politician_answers` — stance rows (currently 0 for all LB officials)
- Supabase Storage `politician_photos` bucket — headshot uploads for new officers

### Key Schema Values (CA convention)
- `governments.state='CA'` (uppercase), `governments.geo_id='0643000'`
- `districts.state='CA'` (UPPERCASE for CA — lowercase 'ca' returns 0 rows)
- Government name (existing): `'City of Long Beach, California, US'`
- Chamber name (existing council): `'Long Beach City Council'`
- Council title (existing): `'Councilmember'`

</code_context>

<specifics>
## Specific Ideas

- The **9th council district** is the key roster unknown — verify against longbeach.gov which of D1–D9 is missing from the DB (8 currently seated) and its current status.
- Long Beach **City Prosecutor** is an unusual elected office (most CA cities have only an elected/appointed City Attorney). Confirm it is a separately-elected office and model it as its own chamber/office, distinct from City Attorney.
- Verify the **current officeholders** for Mayor, all 9 council seats, City Attorney, City Prosecutor, City Auditor as of 2026 (Long Beach held elections November 2024 / runoffs) — do not assume the migration-294 roster is still current for every seat.
- Headshots are largely present (9/9) but check quality + dedupe; new officers will need headshots from longbeach.gov (verify CMS pattern — possible ArcGIS/AEM-style background-image embedding like Sacramento).

</specifics>

<deferred>
## Deferred Ideas

- **Wave-2 greenfield assumption is wrong** (milestone-level): At least Long Beach and Carson were pre-seeded before v17.0. Every Wave-2 phase (143–156) must DB-pre-check before assuming greenfield, and the ROADMAP/STATE "all 15 cities greenfield" Key Fact should be softened to "geofences exist; verify existing seed per city." → roadmap/state maintenance, surfaced from Phase 142.
- **LBUSD elected Board of Education** — out of scope for v17.0; candidate for a future school-board coverage milestone.

</deferred>

---

*Phase: 142-long-beach-deep-seed*
*Context gathered: 2026-06-19*
