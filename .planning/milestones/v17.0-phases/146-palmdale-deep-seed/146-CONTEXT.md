# Phase 146: Palmdale deep-seed - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Source:** Live DB pre-check (`mcp__supabase-local`, both link directions) + official-source structure research (cityofpalmdaleca.gov, avpress.com, Ballotpedia) + Glendale/Lancaster/Santa Clarita reconcile precedent

<domain>
## Phase Boundary

Bring the **City of Palmdale, CA** (geo_id `0655156`) to full Tier 1 depth (PLMD-01): **reconcile + complete + headshots + evidence-only stances**. NOT greenfield — a partial, defective seed already exists. This phase backfills the geo_id, merges a duplicate council chamber, **corrects the form of government from (wrong) at-large to Palmdale's real 5-single-member-district structure**, completes the roster (one member missing), repairs a bidirectional office↔politician link, flags the rotational Mayor, fills the one photo gap, and applies evidence-only stances.

**In scope:** Palmdale **city council only** — 5 single-member districts (1–5) + the council-selected rotational Mayor.
**Out of scope:** Palmdale Elementary (separate government `cc407856`) and any Palmdale school district; the 2026 election pipeline (Districts 3/4/5 are up Nov 2026 — seed current seating only); per-district geo boundaries (city-level G4110 geofence already loaded); Landing.jsx surfacing (Phase 157 close-out).
</domain>

<db_precheck>
## DB Pre-Check (live `mcp__supabase-local`) — verified 2026-06-20

**Government row:** `name = 'City of Palmdale, California, US'`, id **`4f59ebad-631b-4340-91f0-091a6cecb3bb`**, `type=LOCAL`, **`geo_id = NULL`** → backfill `'0655156'` (state already `'CA'`). (Separate `Palmdale Elementary` gov `cc407856` — out of scope.)

**Duplicate "City Council" chambers** (same name + `slug='palmdale-city-council'`) — split-section defect:

| Chamber | official_count | offices | Disposition |
|---------|----------------|---------|-------------|
| `000d672d-97f1-4f1f-af61-9eb6f008c4fd` | 5 (stale) | 3 | **SURVIVOR** |
| `c8e8d31e-c9f2-4d50-9a94-66be603a5c45` | NULL | 1 | **DELETE** (after moving its 1 office) |

**Offices + occupants** (4 seated; should be 5):

| Office UUID | Chamber | Title (DB) | district_id (DB label) | Occupant | ext_id | back-ptr (`politicians.office_id`) | Real district |
|-------------|---------|-----------|------------------------|----------|--------|-----------------------------------|---------------|
| `6ca2f775-a206-42f4-817e-bfb8d0f865aa` | `000d672d` | Councilmember | `7fe09a06` (At-Large) | **Andrea Alarcón** | `692518` | OK | **District 5** |
| `2e584cbd-f6e9-4213-8a7d-0ed319ad6c55` | `000d672d` | Councilmember | `6ad1e005` (At-Large) | **Richard J. Loa** | `692504` | OK | **District 2** |
| `a67a975e-9743-435b-a44c-1badb47866c3` | `000d672d` | Councilmember | `a1d3e3bf` (At-Large) | **Eric Ohlsen** | `692516` | OK | **District 4** + **MAYOR** |
| `198661de-2850-46a1-954e-ef502122a40c` | `c8e8d31e` | Council Member | `f61fd139` (At-Large) | **Austin Bishop** | `-201331` | **NULL** ✗ | **District 1** (Mayor Pro Tem) |

**District rows** (all currently `label='At-Large'`, `district_type='LOCAL'`, `geo_id='0655156'`) — relabel to match occupant's real district (see D-02). A 5th district row (**District 3**) must be created.

**Missing member:** **District 3 = Laura Bettencourt** — NO real politician row exists (only campaign-finance committee rows, e.g. `BETTENCOURT FOR PALMDALE CITY COUNCIL (DISTRICT 3)` and a 2026 re-elect committee — **ignore those**, exactly like Lancaster's White/Castellanos). "Paul Bettencourt" (`-100407`) is an **unrelated** active person — do not touch.

**Next custom ext_id:** `-7000xx` block min is `-700656` (Lancaster's Castellanos) → next free is **`-700657`** → Bettencourt `-700657`.

**Next structural migration:** Lancaster ended at on-disk `917_rocio_castellanos_stances.sql` → next is **918**.

### Verified current structure (official sources)
- **5 single-member districts**, one councilmember each, by-district (CVRA — *Jauregui v. Palmdale*). Roster: **D1 Austin Bishop** (Mayor Pro Tem), **D2 Richard J. Loa**, **D3 Laura Bettencourt**, **D4 Eric Ohlsen** (Mayor), **D5 Andrea Alarcón**.
- **Rotational Mayor, council-selected.** Method **changed April 1 2025** (4–1 vote) from automatic district-rotation to a **majority council vote at the first December meeting**; council "may from time to time replace either or both." NOT a separately elected at-large mayor seat anymore.
- **Current Mayor = Eric Ohlsen (D4)** since **Jan 1 2026**; **Mayor Pro Tem = Austin Bishop (D1)**. (Re-confirm at apply time — rotates each December; a 2026 incident also surfaced around the mayor title, so verify live before writing.)
- Staggered terms: D1/D2 elected 2020 (up 2024), D3/D4/D5 elected 2022 (**up Nov 2026** — out of scope this phase).
</db_precheck>

<decisions>
## Implementation Decisions

### Reconcile / data hygiene (carried from 143/144/145 conventions)
- **D-01:** Reconcile the EXISTING seed (UPDATE/move/relabel, not greenfield rebuild). Preserve all politician rows; never duplicate a person. Re-confirm both link directions in a Wave-1 pre-flight SELECT and STOP on drift.
- **D-02 (NEW — district modeling):** Palmdale is **by-district**. **Relabel** the 4 existing At-Large district rows to match their occupant's real district — `f61fd139`→"District 1" (Bishop), `6ad1e005`→"District 2" (Loa), `a1d3e3bf`→"District 4" (Ohlsen), `7fe09a06`→"District 5" (Alarcón) — keeping `district_type='LOCAL'`, `geo_id='0655156'`. **Create** one new district row "District 3" (LOCAL, geo_id `0655156`) for Bettencourt. No per-district geo boundaries this phase. (Chosen over creating 5 fresh rows / title-only labeling.)
- **D-03:** Backfill `essentials.governments.geo_id = '0655156'` on gov `4f59ebad`, guarded `WHERE geo_id IS NULL`.
- **D-04:** Merge duplicate chambers — survivor `000d672d`, move Bishop's office `198661de` from `c8e8d31e` into it, then DELETE the emptied `c8e8d31e` (move-then-delete, target by UUID only — both share name/slug). End: ONE "City Council" chamber, 5 district offices, `official_count=5`.
- **D-05:** **Repair the bidirectional link** — set `politicians.office_id='198661de…'` for Bishop (currently NULL). Keep BOTH `offices.politician_id` and `politicians.office_id` in sync on every roster write.
- **D-06:** Structural migration(s) (geo_id + chamber merge + district relabel/create + roster reseat/repair + Mayor flag + Bettencourt create) register in `supabase_migrations.schema_migrations`. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative; next structural = **918**.
- **D-07:** Run `feedback_section_split_check` SQL after consolidation — expect Palmdale **absent** (0 rows). (5 OTHER cities have pre-existing split-section defects — out of scope; `project_split_section_defects_5_cities`.)

### Roster + structure (DB-verified 2026-06-20)
- **D-08 (mayor — Glendale model):** Rotational Mayor flagged via **`title='Mayor'` on Ohlsen's D4 council seat** (office `a67a975e`); the other 4 seats `title='Councilmember'`. **NO separate Mayor office / chamber / LOCAL_EXEC district.** Re-confirm current mayor at apply time (rotates each December).
- **D-09:** Target current 5 = Bishop (D1), Loa (D2), Bettencourt (D3, **create** `-700657`), Ohlsen (D4, Mayor), Alarcón (D5). KEEP/relabel the 4 existing; CREATE Bettencourt + her District 3 office in the survivor chamber. No retirements needed (all 4 existing are current).
- **D-10:** Mayor Pro Tem (Bishop) is **not** modeled as a distinct title — `title='Councilmember'` for Bishop (only Mayor is flagged, per Glendale precedent). Pro-tem status is informational only.

### Headshots
- **D-11:** Only gap is **Laura Bettencourt (D3)** — source + process her portrait (crop 4:5 FIRST → 600×750 Lanczos q90 JPEG → Storage `politician_photos/{uuid}-headshot.jpg` → `politician_images` type='default', press_use, photo_origin_url). Leave the existing 4 photos as-is unless a quick check shows one visibly broken/low-res. cityofpalmdaleca.gov may be WAF/403 → retrieval may be `checkpoint:human-verify`; fallbacks: Ballotpedia / campaign site / official council bio page. No fabricated photos; document a genuine gap if none found; never stretch.

### Stances
- **D-12:** Evidence-only compass stances for the **5 current members**, **chairs model** (1–5 = discrete position statements, NOT polarity; `feedback_compass_chairs_not_polarity`). ONE research agent at a time (`feedback_stance_research_one_at_a_time`). ALL live compass topics (`feedback_stance_research_all_topics`), not just local. No defaults; honest blanks (`feedback_stance_no_default_value`); 100% citation (paired `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs). Query live `inform.compass_topics` (is_live); never retired IDs.
- **D-13:** **NO judicial-* topics** — Palmdale is council-manager with an appointed City Attorney. Only live non-judicial topics.
- **D-14:** Evidence note: Ohlsen (Mayor), Bishop, Loa, Alarcón, Bettencourt all have multi-year records (agendas/minutes, AV Press coverage). Expect findable records; honest blanks where evidence is thin. Sources: cityofpalmdaleca.gov agendas/minutes, avpress.com (Antelope Valley Press), campaign sites.

### Claude's Discretion
- Migration granularity (one structural file vs. reconcile+complete split like Lancaster 910/911; one stance file per official like 913/914/916/917). Whether to re-source any existing image found to be poor. Keep all SQL idempotent and guarded.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase precedent (the direct playbook — read first)
- `.planning/phases/144-glendale-deep-seed/144-CONTEXT.md` + `144-0{1..4}-SUMMARY.md` — **rotational-mayor (title-on-seat) precedent** (D-08 source); duplicate-chamber merge
- `.planning/phases/145-lancaster-deep-seed/145-CONTEXT.md` + `145-0{1..4}-SUMMARY.md` — most recent AV-city reconcile; geo_id backfill, move-then-delete, create-new-member, bidirectional-link repair, audit-only migrations
- `.planning/phases/143-santa-clarita-deep-seed/143-0{1..4}-SUMMARY.md` — move-then-delete + reseat pattern
- `C:/EV-Accounts/backend/migrations/910_lancaster_reconcile.sql` (+911 complete, 912 headshots, 913/914/916/917 stances) and Glendale 902–909 — copy these SQL patterns

### Project rules / conventions
- `.planning/REQUIREMENTS.md` — PLMD-01; out-of-scope (school districts, party display, default stances, 2026 election pipeline)
- `.planning/ROADMAP.md` — Phase 146 entry + Wave-2 reconcile conventions
- `.planning/STATE.md` — stance method, transportation scale, split-section convention
- `LOCATION-ONBOARDING.md` — CA city deep-seed quick reference (chambers.slug GENERATED, districts.state='CA', headshot processing, stance ledger bypass)
- Project memory: `project_v170_wave2_not_greenfield` (reconcile reality + bidirectional-link trap), `feedback_compass_chairs_not_polarity`, `feedback_section_split_check`, `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`, `feedback_stance_no_default_value`, `feedback_headshot_*`, `feedback_no_git_in_ev_accounts`

### Live data anchors (DB-verified 2026-06-20)
- All UUIDs/ext_ids in `<db_precheck>` (gov `4f59ebad`, chambers `000d672d` survivor / `c8e8d31e` delete, the 4 offices, 4 district rows, 4 occupants)
- Live compass topic IDs / chairs: `inform.compass_topics` (is_live, judicial_role) — query directly

### Structure sources (official, for success-criterion #2)
- `https://www.cityofpalmdaleca.gov/304/City-Council` and `/443/District-Map` — roster + districts
- `https://www.cityofpalmdaleca.gov/CivicAlerts.aspx?AID=2113` — Ohlsen mayor / Bishop pro-tem (Jan 1 2026)
- `https://www.avpress.com/news/palmdale-oks-new-way-to-pick-mayor/...` — April 1 2025 mayor-selection change
- `https://ballotpedia.org/Palmdale,_California` — cross-check
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Lancaster migration set (910–917) is the closest template (geo_id backfill + move-then-delete duplicate chamber + create-new-member into chamber + bidirectional-link repair + audit-only headshot/stance files).
- Headshot pipeline (curl → Pillow crop/resize → Supabase Storage via service-role key in `C:/EV-Accounts/backend/.env`) proven in 142–145.
- Stance apply pattern: `WITH pol AS (SELECT id … WHERE external_id=N)` + paired INSERT … ON CONFLICT (politician_id, topic_id) DO UPDATE.

### Established Patterns
- SQL migrations live in non-git `C:/EV-Accounts/backend/migrations/`; only `.planning` docs are committed here. Apply via `mcp__supabase-local` (= production DB). **Never run git in `C:/EV-Accounts`.**
- Structural migrations register in `schema_migrations`; headshot/stance audit-only ones do not.
- `essentials.offices.politician_id` and `essentials.politicians.office_id` are independent pointers — KEEP BOTH IN SYNC (this phase repairs Bishop's desync).
- `essentials.districts` carries `district_type`/`label` (NOT on `offices`); relabel district rows there.

### Integration Points
- Palmdale renders on the existing browse/compass UI once reconciled (no frontend change in THIS phase). Landing.jsx surfacing is Phase 157.

### NEW for this wave
- First **by-district** city in LA-County Wave 2 (143/144/145 were at-large). The district-relabel approach (D-02) is the new pattern; later by-district cities can reuse it.
</code_context>

<specifics>
## Specific Ideas

- Palmdale's mayor-selection method **changed April 1 2025** — the planner/researcher MUST verify the *current* Mayor live before flagging `title='Mayor'`; do not hardcode Ohlsen blindly (rotates each December; a 2026 mayor-title dispute also surfaced).
- All structural facts (UUIDs, occupants, districts, missing member) are DB-verified 2026-06-20. Wave-1 pre-flight must re-confirm both link directions and STOP on drift.
- Ignore all `BETTENCOURT …` campaign-finance committee rows; create exactly one real Laura Bettencourt politician (`-700657`).
</specifics>

<deferred>
## Deferred Ideas

- **Per-government "how this body is elected" blurb (NEW idea, 2026-06-20):** A plain-language description of each local government's election process (by-district vs at-large, mayor selection, term staggering). Genuinely valuable — these governments are highly heterogeneous and confusing to voters (Palmdale: by-district + council-selected rotational mayor changed in 2025; Lancaster: directly-elected mayor + at-large; Glendale: at-large + rotational mayor). **Own future phase / cross-cutting feature**, not part of any single deep-seed, because it needs: (1) schema — `essentials.governments` has no description field today; (2) UI to display it; (3) backfill across all ~60+ seeded governments for consistency; (4) the same evidence/citation rigor as stances. Palmdale's election-process facts are already captured in this CONTEXT.md `<db_precheck>` so its blurb content is ready when the feature is built. → Recommend adding to `.planning/REQUIREMENTS.md` Future Requirements.
- Cleanup of the 5 OTHER cities' pre-existing split-section defects — own future phase.
- Palmdale school district(s) deep-seed — separate government, out of milestone scope.
- 2026 election (Districts 3/4/5) candidate/results ingestion — future discovery pipeline.

None of the above belong in Phase 146.
</deferred>

---

*Phase: 146-palmdale-deep-seed*
*Context gathered: 2026-06-20 (live DB pre-check + official-source structure verification)*
