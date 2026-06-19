# Phase 144: Glendale deep-seed - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the **City of Glendale, CA** (geo_id `0630000`, government `a7433437-341a-48e7-907e-a61318954f0a`) to full Tier 1 depth (GLEN-01): **reconcile + complete + headshots + evidence-only stances** for the 5 at-large city councilmembers. NOT greenfield — the city government shell and a 5-member council already exist; this phase cleans up duplicate structure, fills photo/stance gaps, and flags the current rotational Mayor.

**In scope:** city council (5 at-large seats) only.
**Out of scope:** Glendale Unified school board (`364ff903`, separate government — per REQUIREMENTS), the June 2, 2026 election pipeline beyond confirming who is currently seated, geofences (already loaded).
</domain>

<decisions>
## Implementation Decisions

### Reconcile / data hygiene (carried from SC/LB pattern)
- **D-01:** Reconcile the EXISTING partial seed (UPDATE-not-INSERT), no greenfield rebuild, no duplicate offices/external_ids. Preserve existing politician rows; **reseat, never duplicate** people.
- **D-02:** Backfill `essentials.governments.geo_id = '0630000'` on gov `a7433437` (currently NULL), guarded `WHERE geo_id IS NULL`.
- **D-03:** **Delete the empty duplicate chamber** `c019a553` (external_id `-200687`, "Glendale City Council", 0 offices/0 seated). Survivor is `771727ec` (external_id `10450`, `official_count=5`). Target by UUID only (both share the name). Simpler than SC — the duplicate is empty, so no offices/members to move first.
- **D-04:** This reconcile (geo_id + chamber delete) is a STRUCTURAL migration → registers in `supabase_migrations.schema_migrations` normally. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter is authoritative.
- **D-05:** Run the `feedback_section_split_check` SQL after consolidation — expect Glendale absent (0 rows for it). (5 OTHER cities have pre-existing split-section defects — out of scope here; see `project_split_section_defects_5_cities`.)

### Roster (verified live 2026-06-19)
- **D-06:** Current 5 at-large councilmembers, all already in survivor chamber `771727ec`, all active + office-linked: **Ara Najarian** (`-700100`), **Ardy Kassakhian** (`686339`), **Daniel Brotman** (`686340`), **Elen Asatryan** (`686337`), **Vartan Gharpetian** (`686336`). The DB roster is CURRENT and ACCURATE — Gharpetian was initially suspected stale but **re-won in March 2024 and is still serving** (glendaleca.gov councilmember page; confirmed live). No stale-member retirement needed (contrast SC's Smyth).
- **D-07:** ⚠ Research MUST still confirm the roster against glendaleca.gov AND check **June 2, 2026 election** results — seats may have just turned over (today is 2026-06-19). If membership changed, apply the reseat/retire pattern (preserve rows, retire-not-delete, reseat real current members — never create duplicate people). Re-verify external_ids before any write.

### Rotational Mayor (carried from SC D-05)
- **D-08:** Glendale is **council-manager with a rotational Mayor** (council selects). Flag the current Mayor by setting `title='Mayor'` on that member's existing council seat — **NO separate LOCAL_EXEC district / Mayor chamber / Mayor office**.
- **D-09:** Current Mayor = **Ardy Kassakhian** (`686339`), selected April 2026 (succeeded Ara Najarian, who was Mayor 2025–2026). Flag Mayor on Kassakhian's seat. Re-confirm at apply time (mayor rotates; could change after June 2026 election). All other 4 seats `title='Councilmember'`.

### Headshots (carried from SC/LB pattern)
- **D-10:** Fill the **3 missing portraits** — Najarian (`-700100`), Brotman (`686340`), Gharpetian (`686336`) — from glendaleca.gov (research finds exact URLs; their councilmember pages exist). Process: crop to 4:5 FIRST → resize 600×750 Lanczos q90 JPEG → upload to Storage `politician_photos/{uuid}-headshot.jpg` → `politician_images` type='default', `press_use`; set `photo_origin_url`.
- **D-11:** Audit the existing 2 images (Kassakhian, Asatryan) for license/path hygiene; upgrade to `press_use`/canonical if scraped/empty/old-path (as done for SC Weste/Ayala). No superimposed text/graphics; never stretch.

### Stances (carried from SC/LB pattern)
- **D-12:** Evidence-only compass stances for all 5, **chairs model** (each 1–5 is a discrete position statement to match against documented record — NOT a polarity axis; see `feedback_compass_chairs_not_polarity`). One research agent at a time (rate-limit rule). No defaults; honest blanks; 100% citation (paired `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs).
- **D-13:** **NO judicial-* topics** — Glendale's City Attorney is **appointed, not elected** (no elected legal officer in scope). Only live non-judicial topics; never the retired topic IDs.
- **D-14:** Glendale-specific evidence note: heavily Armenian-American electorate; likely strong records on local-immigration, housing/growth-and-development, public-safety, transportation (Metrolink/710), local-environment, and possibly Artsakh/Armenia-related resolutions (which may NOT map cleanly to any chair → honest blank/EXTRA). Brotman has a strong climate/environment record (Glendale Water & Power coal exit). Evidence sources: glendaleca.gov agendas/minutes, Glendale News-Press / outlooknewspapers.com, signalscv-equivalent local press, first-party campaign sites.

### Claude's Discretion
- Exact migration numbering (next on-disk: structural continues the C:/EV-Accounts sequence; stance/headshot files audit-only). Per-official stance file granularity (one file per official, like SC 897–901). Whether to re-source the existing 2 images (only if it improves quality).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase precedent (the direct playbook — read first)
- `.planning/phases/143-santa-clarita-deep-seed/143-CONTEXT.md` — the immediately-prior near-identical reconcile (duplicate chamber, rotational mayor, reseat pattern)
- `.planning/phases/143-santa-clarita-deep-seed/143-01-SUMMARY.md` … `143-04-SUMMARY.md` — exact migration shapes (reconcile / roster / headshots / stances) + the reseat decision
- `.planning/phases/142-long-beach-deep-seed/142-0{1..4}-SUMMARY.md` — earlier precedent
- `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql` + `895`/`896`/`897-901` — copy these SQL patterns

### Project rules / conventions
- `.planning/REQUIREMENTS.md` — GLEN-01 definition; out-of-scope (school districts, party display, default stances)
- `.planning/STATE.md` — stance method notes, transportation-priorities scale (1=transit, 5=highways), split-section convention
- `LOCATION-ONBOARDING.md` — CA city deep-seed quick reference (chambers.slug GENERATED, districts.state='CA' uppercase, headshot processing, stance ledger bypass)
- Project memory: `feedback_compass_chairs_not_polarity`, `feedback_section_split_check`, `project_v170_wave2_not_greenfield`, `project_split_section_defects_5_cities`, `feedback_stance_research_one_at_a_time`, `feedback_stance_no_default_value`, `feedback_headshot_*`

### Live data anchors (DB-verified 2026-06-19)
- Live compass topic IDs / 5-chair scale: `inform.compass_topics` (is_live, judicial_role) + `inform.compass_stances` — query directly; do NOT hardcode retired IDs
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- SC migration set (894–901) is the near-exact template — Glendale is simpler (empty duplicate chamber, no stale member to retire).
- Headshot pipeline (curl download → Pillow crop/resize → Supabase Storage upload via service-role key in `C:/EV-Accounts/backend/.env`) proven in 143.
- Stance apply pattern: `WITH pol AS (SELECT id ... WHERE external_id=N)` + paired INSERT … ON CONFLICT (politician_id, topic_id) DO UPDATE.

### Established Patterns
- SQL migrations live in non-git `C:/EV-Accounts/backend/migrations/`; only `.planning` docs are committed in the essentials repo. Apply via `mcp__supabase-local` (= production DB).
- Structural migrations register in `schema_migrations`; headshot/stance audit-only ones do not.

### Integration Points
- `essentials.governments` / `chambers` / `offices` / `politicians` / `politician_images`; `inform.politician_answers` / `politician_context` / `compass_topics` / `compass_stances`.
- Glendale renders on the existing browse/compass UI once seeded (no frontend change needed); confirm Landing.jsx already surfaces LA-County cities.
</code_context>

<specifics>
## Specific Ideas

- "Carry the SC/LB pattern" — the user explicitly wants minimal ceremony; this phase is a templated reconcile. Keep plans tight (likely 4 waves: reconcile → roster/mayor → headshots → stances), mirroring 143.
- The one real risk the user flagged early (roster accuracy) was resolved during discussion: roster is current; Mayor is Kassakhian. The remaining live-data risk is the **June 2, 2026 election** — research must check it before writing.
</specifics>

<deferred>
## Deferred Ideas

- Cleanup of the 5 OTHER cities' pre-existing split-section defects (Whittier/Compton/Carson/South El Monte/South Pasadena) — its own future phase (`project_split_section_defects_5_cities`).
- Glendale Unified school board deep-seed — separate from city council, out of milestone scope.
- 2026 Glendale election candidate/results ingestion beyond confirming current seating — future discovery pipeline.

None of these belong in Phase 144.
</deferred>

---

*Phase: 144-glendale-deep-seed*
*Context gathered: 2026-06-19*
