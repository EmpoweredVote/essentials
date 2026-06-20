# Phase 145: Lancaster deep-seed - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning
**Source:** DB pre-check (live 2026-06-19) + Glendale/Long Beach/Santa Clarita reconcile precedent

<domain>
## Phase Boundary

Bring the **City of Lancaster, CA** (geo_id `0640130`) to full Tier 1 depth (LANC-01): **reconcile + complete + headshots + evidence-only stances**. NOT greenfield — a partial, defective seed already exists. This phase backfills the geo_id, merges duplicate council chambers, seats the full current roster, fills photo gaps, and applies evidence-only stances.

**In scope:** Lancaster city council only (directly-elected Mayor + at-large council).
**Out of scope:** Lancaster Elementary / any Lancaster school district (separate government), the 2024/2026 election pipeline beyond confirming who is currently seated, geofences (G4110 already loaded in v7.0).
</domain>

<db_precheck>
## DB Pre-Check (live `mcp__supabase-local`, 2026-06-19) — THE reason this is reconcile-not-greenfield

Government row **already exists**: `name = 'City of Lancaster, California, US'`, `type=LOCAL`, but **`geo_id = NULL`** (this is why a `geo_id='0640130'` lookup misses it).

**Duplicate "City Council" chambers** (identical `slug='lancaster-city-council'`) — a split-section defect:

| Chamber UUID | Offices | Seated |
|--------------|---------|--------|
| `9b9014b4-0106-417f-a104-ac2055fc8134` | 4 (Mayor + 3× Council Member) | **all empty** — politician=null, 0 images, 0 stances |
| `a9be708e-1b42-42ac-92ec-e8e56f9c6474` | 1 (Council Member) | **Marvin Crist** (ext_id `686320`, 1 image), 0 stances |

Net: roster scattered across two chambers; only 1 of ~5 seats filled; **0 stances anywhere**. The two chambers' offices sum to **Mayor + 4 Council Member = 5 seats**, which matches Lancaster's real structure (directly-elected Mayor + 4 at-large council) — so consolidation should yield exactly one chamber with 5 offices.

**⚠ Differs from Glendale (144):** Glendale's duplicate chamber was *empty* (simple delete). Here the duplicate (`a9be708e`) holds the *only seated member* (Crist). The reconcile must **move Crist's office into the survivor chamber FIRST, then delete the emptied duplicate** (the Santa Clarita move-then-delete pattern, not the Glendale delete-empty pattern).

**Next custom ext_id block:** the `-7000xx` block currently spans `-700001 … -700654` (72 rows). Next free is **`-700655`** onward for any newly-added politicians. (Crist keeps `686320`; reuse real provider ext_ids where a member already exists.)
</db_precheck>

<decisions>
## Implementation Decisions

### Reconcile / data hygiene (carried from SC/LB/Glendale pattern)
- **D-01:** Reconcile the EXISTING partial seed (UPDATE/move, not greenfield rebuild). Preserve existing politician rows; **reseat, never duplicate** people. Crist (`686320`) is preserved and reseated, not recreated.
- **D-02:** Backfill `essentials.governments.geo_id = '0640130'` on the Lancaster gov row (currently NULL), guarded `WHERE geo_id IS NULL`.
- **D-03:** **Survivor chamber = `9b9014b4`** (holds the Mayor + 3 Council Member shells, the larger structure). Move Crist's office from `a9be708e` into `9b9014b4`, then **DELETE the emptied duplicate `a9be708e`**. Target chambers by UUID only (both share name+slug). End state: ONE City Council chamber with exactly 5 offices (1 Mayor + 4 Council Member), `official_count=5`.
- **D-04:** This reconcile (geo_id backfill + office move + chamber delete) is a STRUCTURAL migration → registers in `supabase_migrations.schema_migrations` normally. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter is authoritative.
- **D-05:** Run the `feedback_section_split_check` SQL after consolidation — expect Lancaster **absent** (0 rows) once the duplicate chamber is gone. (5 OTHER cities have pre-existing split-section defects — out of scope here; see `project_split_section_defects_5_cities`.)

### Roster + structure (DB-verified shells; member identities RESEARCH-MUST-CONFIRM)
- **D-06:** Target structure is **directly-elected Mayor (own seat, `title='Mayor'`) + 4 at-large Council Members** — this is the KEY contrast with Glendale (Glendale = council-manager rotational mayor flagged on a council seat). Lancaster's Mayor is a real, separately directly-elected office; keep the existing Mayor office, do NOT collapse it into a council seat.
- **D-07:** ⚠ **Research MUST confirm the current roster** against the official city site (cityoflancasterca.gov) and check for any **2024 / June-2026 election turnover** (today is 2026-06-19). Known-likely incumbents to verify (do NOT seed without confirmation): Mayor **R. Rex Parris**; Council incl. **Marvin Crist** (already seated), and the other three at-large seats. If membership changed, apply reseat/retire (preserve rows, retire-not-delete, reseat real current members — never duplicate people). Re-verify external_ids before any write; new members get `-700655`+.
- **D-08:** ⚠ **Research MUST confirm district-vs-at-large.** Lancaster has historically elected council **at-large**; CVRA pressure has pushed some LA-County cities to by-district. Confirm the *current* method and seat count from the official site before finalizing office structure. If still at-large, the 4 council offices are at-large (no `district_id`).

### Headshots (carried from SC/LB/Glendale pattern)
- **D-09:** Fill missing portraits for every seated member that has an official portrait (Mayor + the council members other than Crist, plus audit Crist's existing 1 image for hygiene). Source from cityoflancasterca.gov (research finds exact URLs). Process: crop to 4:5 FIRST → resize 600×750 Lanczos q90 JPEG → upload to Storage `politician_photos/{uuid}-headshot.jpg` → `politician_images` type='default', `press_use`; set `photo_origin_url`. Genuine gaps documented (no fabricated photos); no superimposed text/graphics; never stretch.

### Stances (carried from SC/LB/Glendale pattern)
- **D-10:** Evidence-only compass stances for all seated members, **chairs model** (each 1–5 is a discrete position statement to match against the documented record — NOT a polarity axis; see `feedback_compass_chairs_not_polarity`). One research agent at a time (rate-limit rule). No defaults; honest blanks; 100% citation (paired `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs). Query live `inform.compass_topics` (is_live) for current topic IDs; never use retired IDs.
- **D-11:** **NO judicial-* topics** — Lancaster's City Attorney is appointed (contract), not elected (confirm in research; mirrors Glendale D-13). Only live non-judicial topics.
- **D-12:** Lancaster-specific evidence note: long-tenured Mayor Parris with a strong, well-documented public record (homelessness initiatives, hydrogen/clean-energy push, public-safety stance, development). Likely findable records on housing/growth, public-safety, local-environment/energy, homelessness. Sources: cityoflancasterca.gov agendas/minutes, Antelope Valley Press (avpress.com), local press, first-party campaign sites.

### Claude's Discretion
- Exact migration numbering (structural continues the `C:/EV-Accounts/backend/migrations/` sequence; stance/headshot files audit-only). Per-official stance file granularity (one file per official, like SC 897–901). Whether to re-source Crist's existing image (only if it improves quality).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase precedent (the direct playbook — read first)
- `.planning/phases/144-glendale-deep-seed/144-CONTEXT.md` + `144-0{1..4}-SUMMARY.md` — most recent near-identical reconcile (geo_id backfill, duplicate chamber, reseat, headshots, stances)
- `.planning/phases/143-santa-clarita-deep-seed/143-0{1..4}-SUMMARY.md` — the **move-then-delete** chamber pattern (SC had members to move, like Lancaster does)
- `.planning/phases/142-long-beach-deep-seed/142-0{1..4}-SUMMARY.md` — earlier reconcile+complete precedent
- `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql` (+ 895/896/897-901) and the Glendale 902–909 set — copy these SQL patterns

### Project rules / conventions
- `.planning/REQUIREMENTS.md` — LANC-01 definition; out-of-scope (school districts, party display, default stances)
- `.planning/ROADMAP.md` — Phase 145 entry + "Wave 2 deep-seed — shared conventions" block
- `.planning/STATE.md` — stance method notes, transportation-priorities scale, split-section convention
- `LOCATION-ONBOARDING.md` — CA city deep-seed quick reference (chambers.slug GENERATED, districts.state='CA' uppercase, headshot processing, stance ledger bypass)
- Project memory: `feedback_compass_chairs_not_polarity`, `feedback_section_split_check`, `project_v170_wave2_not_greenfield`, `project_split_section_defects_5_cities`, `feedback_stance_research_one_at_a_time`, `feedback_stance_no_default_value`, `feedback_headshot_*`

### Live data anchors (DB-verified 2026-06-19)
- Lancaster gov row `City of Lancaster, California, US` (geo_id NULL); chambers `9b9014b4` (survivor, 4 offices) + `a9be708e` (duplicate, Crist) — see `<db_precheck>`
- Live compass topic IDs / 5-chair scale: `inform.compass_topics` (is_live, judicial_role) + `inform.compass_stances` — query directly; do NOT hardcode retired IDs
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- SC migration set (894–901) and Glendale set (902–909) are near-exact templates. Lancaster is closest to **SC** (move-then-delete a non-empty duplicate chamber).
- Headshot pipeline (curl download → Pillow crop/resize → Supabase Storage upload via service-role key in `C:/EV-Accounts/backend/.env`) proven in 142–144.
- Stance apply pattern: `WITH pol AS (SELECT id ... WHERE external_id=N)` + paired INSERT … ON CONFLICT (politician_id, topic_id) DO UPDATE.

### Established Patterns
- SQL migrations live in non-git `C:/EV-Accounts/backend/migrations/`; only `.planning` docs are committed in the essentials repo. Apply via `mcp__supabase-local` (= production DB).
- Structural migrations register in `schema_migrations`; headshot/stance audit-only ones do not.
- offices link to politicians via `politicians.office_id`; `essentials.governments`/`chambers`/`offices`/`politicians`/`politician_images`; stances in `inform.politician_answers`/`politician_context`.

### Integration Points
- Lancaster renders on the existing browse/compass UI once seeded (no frontend change needed in THIS phase). Landing.jsx surfacing of the 15 cities is Phase 157, not here.
</code_context>

<specifics>
## Specific Ideas

- "Carry the SC/Glendale pattern" — keep plans tight (likely 4 waves: reconcile → roster/mayor → headshots → stances), mirroring 143/144.
- The one real risk is **roster accuracy + election turnover** — research MUST confirm current Mayor + 4 council and district-vs-at-large before any write. The structural facts (geo_id NULL, dup chambers, Crist seated) are DB-verified and locked.
</specifics>

<deferred>
## Deferred Ideas

- Cleanup of the 5 OTHER cities' pre-existing split-section defects (Whittier/Compton/Carson/South El Monte/South Pasadena) — its own future phase (`project_split_section_defects_5_cities`).
- Lancaster school district(s) deep-seed — separate government, out of milestone scope.
- 2024/2026 Lancaster election candidate/results ingestion beyond confirming current seating — future discovery pipeline.

None of these belong in Phase 145.
</deferred>

---

*Phase: 145-lancaster-deep-seed*
*Context gathered: 2026-06-19 (DB pre-check + reconcile precedent)*
