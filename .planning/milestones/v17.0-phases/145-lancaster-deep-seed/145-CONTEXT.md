# Phase 145: Lancaster deep-seed - Context

**Gathered:** 2026-06-19 · **Corrected:** 2026-06-20 (execute-time DB re-verification)
**Status:** Ready for re-planning
**Source:** DB pre-check (live, both link directions) + RESEARCH + Glendale/Long Beach/Santa Clarita reconcile precedent

<domain>
## Phase Boundary

Bring the **City of Lancaster, CA** (geo_id `0640130`) to full Tier 1 depth (LANC-01): **reconcile + complete + headshots + evidence-only stances**. NOT greenfield — a partial, defective, partly-stale seed already exists. This phase backfills the geo_id, merges the duplicate council chamber, repairs the bidirectional office↔politician link, swaps out two members who left office (Malhi lost, Crist retired) for the two April-2026 winners, fills photo gaps, and applies evidence-only stances.

**In scope:** Lancaster city council only (directly-elected Mayor + at-large council).
**Out of scope:** Lancaster Elementary / any Lancaster school district (separate government), election pipeline beyond confirming current seating, geofences (G4110 already loaded).
</domain>

<db_precheck>
## DB Pre-Check (live `mcp__supabase-local`) — CORRECTED 2026-06-20 at execute-time

> ⚠ **The 2026-06-19 pre-check was WRONG** — it joined `politicians.office_id = offices.id` (NULL for these
> rows) and concluded "survivor shells empty, reseat 3 unlinked members." The real link `offices.politician_id`
> was populated all along. Both pointer directions were re-checked 2026-06-20; this is the authoritative state.

Government row: `name = 'City of Lancaster, California, US'`, id **`f6732517-76d8-4f5f-b528-e49d60f32a4c`**,
`type=LOCAL`, **`geo_id = NULL`** → backfill `'0640130'` (state already `'CA'`).

**Duplicate "City Council" chambers** (same name + `slug='lancaster-city-council'`) — split-section defect.
Offices are **already occupied** via `offices.politician_id`; but `politicians.office_id` is **NULL** for all
except Crist (a bidirectional-link inconsistency to repair):

| Chamber | Office UUID | Title | District | Occupant (offices.politician_id) | ext_id | politicians.office_id |
|---------|-------------|-------|----------|----------------------------------|--------|-----------------------|
| `9b9014b4` (survivor) | `ed37230d` | Mayor | `b59c2734` **LOCAL_EXEC** "Lancaster Mayor" | **R. Rex Parris** | `-200795` | NULL |
| `9b9014b4` | `052a2e17` | Council Member | `0097ca4d` At-Large (LOCAL) | **Lauren Hughes-Leslie** | `-201279` | NULL |
| `9b9014b4` | `6e17ff80` | Council Member | At-Large | **Ken Mann** | `-201281` | NULL |
| `9b9014b4` | `03a0dae7` | Council Member | At-Large | **Raj Malhi** ✗ | `-201280` | NULL |
| `a9be708e` (duplicate) | `afd045ec` | Council Member | `9e9b89cd` At-Large | **Marvin Crist** ✗ | `686320` | `afd045ec` |

✗ = NOT current. **Raj Malhi LOST the April 2026 election; Marvin Crist RETIRED (did not file).** The
2 April-2026 winners — **Cedric White** + **Rocio Castellanos** — have NO real politician rows yet
(only campaign-finance committee rows of those names; ignore those). The Mayor office is **already**
correctly typed `LOCAL_EXEC` and seated by Parris (no Mayor structural change needed).

**Schema note:** `district_type` (e.g. `LOCAL_EXEC`, `LOCAL`) lives on **`essentials.districts`**, NOT on
`offices` (offices has only `district_id`). At-large council offices point to the shared At-Large district
`0097ca4d`. Do not attempt `UPDATE offices SET district_type=…` (no such column).

**Next custom ext_id block:** `-7000xx` spans `-700001 … -700654`; next free is **`-700655`** → White `-700655`, Castellanos `-700656`.

### Resolved reconcile actions (DB-verified 2026-06-20 — LOCKED)

Target current 5: Parris (Mayor), Hughes-Leslie, Ken Mann, Cedric White, Rocio Castellanos.

| Person | ext_id | Action |
|--------|--------|--------|
| R. Rex Parris | `-200795` | KEEP as Mayor (office `ed37230d`); **repair back-pointer** `politicians.office_id='ed37230d'` |
| Lauren Hughes-Leslie | `-201279` | KEEP (office `052a2e17`); repair `office_id` back-pointer |
| Ken Mann | `-201281` | KEEP (office `6e17ff80`); repair `office_id` back-pointer |
| Raj Malhi | `-201280` | **RETIRE** (lost): `is_active=false`, `office_id=NULL`; **free office `03a0dae7`** |
| Marvin Crist | `686320` | **RETIRE** (retired): `is_active=false`, `office_id=NULL`; **free office `afd045ec`** |
| Cedric White | new `-700655` | **CREATE** politician; seat into a freed council office |
| Rocio Castellanos | new `-700656` | **CREATE** politician; seat into the other freed council office |

**Office reuse (no office create/delete beyond the chamber merge):** the 2 freed council offices
(`03a0dae7` ex-Malhi, `afd045ec` ex-Crist) are **reassigned** to White + Castellanos — set BOTH
`offices.politician_id` AND the new `politicians.office_id` (keep both pointers in sync). End roster = Mayor +
4 council, all 5 with consistent bidirectional links.

**Chamber merge:** move office `afd045ec` from duplicate `a9be708e` into survivor `9b9014b4`, then DELETE the
emptied `a9be708e` (move-then-delete; target by UUID only — both share name/slug). End: ONE "City Council"
chamber, 5 offices, `official_count=5`.
</db_precheck>

<decisions>
## Implementation Decisions

### Reconcile / data hygiene
- **D-01:** Reconcile the EXISTING seed (UPDATE/move, not greenfield rebuild). Preserve all politician rows; retire-not-delete departed members (Malhi, Crist); reuse their offices for the new members. Never duplicate a person.
- **D-02:** Backfill `essentials.governments.geo_id = '0640130'` on gov `f6732517` (currently NULL), guarded `WHERE geo_id IS NULL`.
- **D-03:** Merge duplicate chambers — survivor `9b9014b4`, move office `afd045ec` from `a9be708e` into it, then DELETE the emptied `a9be708e` (move-then-delete, target by UUID). End: ONE City Council chamber, 5 offices (1 Mayor + 4 Councilmember), `official_count=5`.
- **D-03b (NEW):** **Repair the bidirectional link** — set `politicians.office_id` for every current member to match the office that points to them (`offices.politician_id`). Currently NULL for Parris/Hughes-Leslie/Mann/Malhi. All future writes keep BOTH pointers in sync.
- **D-04:** Structural migration(s) (geo_id + chamber merge + roster reseat/retire/create) register in `supabase_migrations.schema_migrations` normally. Headshot + stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative; next structural = 910.
- **D-05:** Run `feedback_section_split_check` SQL after consolidation — expect Lancaster **absent** (0 rows). (5 OTHER cities have pre-existing split-section defects — out of scope; `project_split_section_defects_5_cities`.)

### Roster + structure (DB-verified 2026-06-20)
- **D-06:** Structure is **directly-elected Mayor (own LOCAL_EXEC seat, already correct) + 4 at-large Councilmembers** (district `0097ca4d`). KEY contrast with Glendale (rotational mayor). No Mayor structural change needed — Parris already seated LOCAL_EXEC.
- **D-07 (CORRECTED):** Roster turnover from the **April 2026 election** is RESOLVED (see `<db_precheck>`): KEEP Parris/Hughes-Leslie/Mann; RETIRE Malhi (lost) + Crist (retired); CREATE White (`-700655`) + Castellanos (`-700656`) into the 2 freed offices. Re-confirm with a pre-flight SELECT (both link directions) before writing; STOP on drift.
- **D-08:** Council is **at-large** (confirmed) — the 4 council offices use the shared At-Large district `0097ca4d`, no per-seat district_id changes.

### Headshots
- **D-09:** Fill missing portraits for current members lacking one (currently 2/5 have images). cityoflancasterca.org is Akamai-WAF/403 → retrieval is `checkpoint:human-verify`; fallbacks: Parris→Wikimedia Commons (200 OK, bot UA), Mann/Hughes-Leslie→AVAQMD CDN (Referer header), White/Castellanos→Ballotpedia. Pipeline: crop 4:5 FIRST → 600×750 Lanczos q90 JPEG → Storage `politician_photos/{uuid}-headshot.jpg` → `politician_images` type='default', press_use, set photo_origin_url. No fabricated photos; document genuine gaps; never stretch.

### Stances
- **D-10:** Evidence-only compass stances for the 5 CURRENT members, **chairs model** (1–5 = discrete position statements, NOT polarity; `feedback_compass_chairs_not_polarity`). ONE research agent at a time. No defaults; honest blanks; 100% citation (paired `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs). Query live `inform.compass_topics` (is_live); never retired IDs. NOT Malhi/Crist (retired).
- **D-11:** **NO judicial-* topics** — Lancaster's City Attorney is appointed (council-manager form). Only live non-judicial topics.
- **D-12:** Evidence note: Mayor Parris has a rich record (homelessness, hydrogen/clean-energy, housing/Prohousing 2025, Feb-2024 sanctuary ordinance, public-safety). White/Castellanos sworn in April 28 2026 — platform-only, expect many honest blanks. Sources: cityoflancasterca.org agendas/minutes, avpress.com (Antelope Valley Press), campaign sites.

### Claude's Discretion
- Migration numbering/granularity (one stance file per official, like SC 897–901 / Glendale 905–909). Whether to re-source Parris/existing images for quality. Whether the geo_id+chamber-merge+roster work is one structural migration (910) or split across 910/911 — planner's call, keep idempotent.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase precedent (the direct playbook — read first)
- `.planning/phases/144-glendale-deep-seed/144-CONTEXT.md` + `144-0{1..4}-SUMMARY.md` — most recent reconcile
- `.planning/phases/143-santa-clarita-deep-seed/143-0{1..4}-SUMMARY.md` — move-then-delete chamber + retire-stale-member pattern (closest to Lancaster)
- `.planning/phases/142-long-beach-deep-seed/142-0{1..4}-SUMMARY.md` — earlier reconcile+complete precedent
- `C:/EV-Accounts/backend/migrations/894_santa_clarita_reconcile.sql` (+895/896/897-901) and Glendale 902–909 — copy these SQL patterns

### Project rules / conventions
- `.planning/REQUIREMENTS.md` — LANC-01; out-of-scope (school districts, party display, default stances)
- `.planning/ROADMAP.md` — Phase 145 entry + corrected "Wave 2 shared conventions" (reconcile reality)
- `.planning/STATE.md` — stance method, transportation scale, split-section convention
- `LOCATION-ONBOARDING.md` — CA city deep-seed quick reference (chambers.slug GENERATED, districts.state='CA', headshot processing, stance ledger bypass)
- Project memory: `project_v170_wave2_not_greenfield` (milestone-wide reconcile reality + bidirectional-link trap), `feedback_compass_chairs_not_polarity`, `feedback_section_split_check`, `feedback_stance_research_one_at_a_time`, `feedback_stance_no_default_value`, `feedback_headshot_*`

### Live data anchors (DB-verified 2026-06-20)
- All UUIDs/ext_ids in `<db_precheck>` above (gov `f6732517`, chambers `9b9014b4`/`a9be708e`, the 5 offices, the 5 occupant rows)
- Live compass topic IDs / chairs: `inform.compass_topics` (is_live, judicial_role) — query directly
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- SC migration set (894–901) is the closest template (move-then-delete a non-empty duplicate chamber + retire a departed member + seat new members).
- Headshot pipeline (curl → Pillow crop/resize → Supabase Storage via service-role key in `C:/EV-Accounts/backend/.env`) proven in 142–144.
- Stance apply pattern: `WITH pol AS (SELECT id … WHERE external_id=N)` + paired INSERT … ON CONFLICT (politician_id, topic_id) DO UPDATE.

### Established Patterns
- SQL migrations live in non-git `C:/EV-Accounts/backend/migrations/`; only `.planning` docs are committed here. Apply via `mcp__supabase-local` (= production DB).
- Structural migrations register in `schema_migrations`; headshot/stance audit-only ones do not.
- `essentials.offices.politician_id` and `essentials.politicians.office_id` are independent pointers — KEEP BOTH IN SYNC on every roster write (this phase repairs an existing desync).

### Integration Points
- Lancaster renders on the existing browse/compass UI once reconciled (no frontend change in THIS phase). Landing.jsx surfacing is Phase 157.
</code_context>

<specifics>
## Specific Ideas

- All structural facts (UUIDs, occupants, stale members, link desync) are DB-verified 2026-06-20 and LOCKED. The pre-flight in Wave 1 must re-confirm both link directions and STOP on any drift.
- The earlier "empty shells / reseat 3 unlinked" framing was a wrong-direction-join artifact — do NOT reintroduce it.
</specifics>

<deferred>
## Deferred Ideas

- Cleanup of the 5 OTHER cities' pre-existing split-section defects (Whittier/Compton/Carson/South El Monte/South Pasadena) — own future phase.
- Lancaster school district(s) deep-seed — separate government, out of milestone scope.
- 2024/2026 election candidate/results ingestion beyond current seating — future discovery pipeline.

None belong in Phase 145.
</deferred>

---

*Phase: 145-lancaster-deep-seed*
*Context corrected: 2026-06-20 (execute-time DB re-verification — both link directions)*
