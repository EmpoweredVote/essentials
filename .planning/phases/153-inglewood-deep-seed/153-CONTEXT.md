# Phase 153: Inglewood deep-seed - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Requirements:** INGL-01
**Source:** /gsd-discuss-phase (live DB pre-check by orchestrator + operator-approved approach)

<domain>
## Phase Boundary

Take **City of Inglewood** (geo_id `0636546`, gov `af811c4b-e4da-4f30-ac33-9a7fe7d434ba`) from a partial/defective
seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only compass
stances. Same 4-wave deep-seed pattern as phases 142–152.

**⚠ This is the MESSIEST RECONCILE so far (DB-confirmed 2026-06-21):** the City of Inglewood gov already exists
with `geo_id` NULL and **two duplicate 'City Council' chambers** (both slug `inglewood-city-council`), holding 6
offices total — and one councilmember (Eloy Morales) is **seeded twice across the two chambers** (a dedup, not
just a chamber merge). Inglewood has a **directly-elected Mayor** (James T. Butts Jr., LOCAL_EXEC) — the El Monte
(151) / Lancaster (145) model, NOT West Covina's rotational title.

**In scope:** City of Inglewood only. **NOT in scope:** `Inglewood Unified, California, US`
(`3c4c8dca-894e-403f-8935-272989bc3c46`) — separate school-district government.
</domain>

<decisions>
## Implementation Decisions

### Structure (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0636546'` on gov `af811c4b`
  (guard `geo_id IS NULL OR geo_id=''`; state already CA), then merge the two duplicate 'City Council' chambers
  (`a25a6dea` official_count 5 / 3 offices bidirectional-clean = **SURVIVOR**; `8b99bcf0` official_count NULL / 3
  offices one-directional = **DOOMED**) into ONE via move-then-delete (UUID-targeted — both share name 'City
  Council' / slug `inglewood-city-council`; assert doomed empty before delete). Repair the 3 one-directional links
  in `8b99bcf0` (Butts `f5775ca1`, Eloy-Jr `ff97a6bb`, Dotson `3e73448b` — all have `offices.politician_id` set,
  `politicians.office_id` NULL). Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, both chamber UUIDs, the 6
  offices + members/ext_ids, both link directions, the office→district map (incl. shared-district check —
  Pomona/Torrance/West-Covina defect), the Eloy-Morales duplicate, and live `schema_migrations` MAX + on-disk MAX.
- **D-01b (Eloy Morales DEDUP — operator-approved):** "Eloy Morales **Jr.**" (`-201081`, pol `ff97a6bb`, office
  `7fd55592`, chamber `8b99bcf0`, **1 image**, one-directional) and "Eloy Morales" (`666263`, pol `729bc539`...
  see note, office `ddcd280b`, chamber `a25a6dea`, **0 images**, bidirectional) are almost certainly the SAME
  councilman. **Research MUST confirm same person first.** If confirmed: **keep the bidirectional `666263` seat as
  the survivor**, **migrate the `-201081` headshot to `666263`** (the dup has the photo, the survivor has none),
  then **unlink-not-delete** `-201081` (null its office↔politician link both directions, KEEP the politician +
  any stance/photo rows). If research finds they are genuinely two different people → keep both.
  *(NOTE: pol UUIDs — Eloy Morales 666263 = `6ed19c10-7b34-47f0-8705-0d154271e362`; Dionne Faulk 666264 =
  `729bc539-3175-4e5d-96ba-c18768890e1e`. Resolve all by external_id at apply time; the pre-flight map is authoritative.)*

### Form of government (Wave 1/2 — DEFER TO RESEARCH, NO guessed default)
- **D-02 (by-district + directly-elected Mayor — verify vs official site):** DB shows 5 At-Large LOCAL council
  rows + Butts as a LOCAL_EXEC 'Inglewood Mayor'. Inglewood is believed **by-district: District 1–4 + a
  directly-elected citywide Mayor** (the El Monte 151 structure, NOT West Covina's rotational). **MANDATORY (the
  Downey/El Monte lesson, [[project_phase150_downey_complete]], [[project_by_district_relabel_pattern]]): research
  MUST verify the form of government, the 4 district numbers + current holders, and the Mayor against the OFFICIAL
  city site (cityofinglewood.org) before committing. No guessed default.** If by-district: relabel the At-Large
  council rows → 'District 1'..'District 4' by verified per-person map (split any shared At-Large district_id —
  the West Covina defect). **KEEP Butts as the directly-elected LOCAL_EXEC Mayor as-is** (do NOT collapse to a
  rotational title). End-state council = **Mayor (LOCAL_EXEC) + District 1–4 = 5 offices**.

### Roster (Wave 2 — verify count + currency, registers in schema_migrations)
- **D-03 (current-seated, retire departed; official_count=4):** After the Eloy dedup the roster should be Mayor
  Butts + 4 district members. Current DB district-seat occupants: Eloy Morales (`666263`), George Dotson
  (`-201082`), Dionne Faulk (`666264`), Gloria D. Gray (`666261`) — **treat as SUSPECT** until verified against
  cityofinglewood.org. **George Dotson is the prime suspected-departed** (likely a former councilmember). Confirm
  the 4 current district holders + Mayor; **unlink-not-delete** any departed (Whittier/SM/Downey/El Monte
  precedent — null link both directions, KEEP politician+stance+photo). Any genuinely-new current member created
  fresh gets a new negative ext_id (`-7010xx` scheme; query MIN(external_id) to avoid collision). Set survivor
  chamber `official_count=4` (the 4 council districts; the directly-elected Mayor is a separate exec office NOT
  counted — El Monte convention).

### Headshots (Wave 3 — verify-and-fix + dedup, audit-only migration)
- **D-04 (dedup Faulk + verify-and-fix; fill gaps honestly):** Image state — Butts 1, Eloy-Jr(-201081) 1,
  Dotson 0, Eloy(666263) 0, Faulk **2 (DEDUP to 1)**, Gray 1. For each CURRENT official: verify correct person,
  no superimposed text/graphics ([[feedback_headshot_no_graphics]]), **600×750** 4:5
  ([[feedback_headshot_image_sizing]]). Dedup Faulk's two rows to one canonical `type='default'`. Migrate the
  `-201081` photo to the surviving Eloy `666263` (D-01b). Fill the 0-image gaps (Dotson if still current, Eloy)
  from cityofinglewood.org (WAF status UNKNOWN — check; many LA-area .org/.gov sites are WAF-403 e.g. Downey/
  Glendale/Pomona; West Covina/El Monte were NO-WAF CivicEngage); operator in-browser fallback if WAF-403;
  alternate hosts (Ballotpedia/SCAG/Wikimedia/campaign) otherwise. Crop 4:5 FIRST → 600×750 Lanczos q90
  ([[feedback_headshot_resize_no_distort]]), upload `politician_photos/{uuid}-headshot.jpg` (x-upsert),
  `type='default'`, real `photo_license` + `photo_origin_url`. Honest gap if no acceptable portrait. Blocking
  human-verify checkpoint. **⚠ Wrong-person guard (the West Covina lesson): verify each image is the actual
  Inglewood official, not a name-collision** (e.g. there are other public figures named Eloy Morales / James Butts).

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–152):** evidence-only **CHAIRS** model (value = the chair the evidence
  matches, never a polarity axis — [[feedback_compass_chairs_not_polarity]]); 100% citation (paired
  `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs); **no
  defaulted/neutral values** ([[feedback_stance_no_default_value]]); honest blank spokes; research ALL non-judicial
  compass topics ([[feedback_stance_research_all_topics]]); **NO judicial-* topics** (Inglewood is council-manager
  with an appointed City Attorney); live non-judicial topics queried at apply time (never hardcode retired IDs —
  [[project_compass_live_topic_ids]]); **ONE research agent at a time** ([[feedback_stance_research_one_at_a_time]]);
  rent-regulation only-if-real-evidence (no manufactured RSO). All 6 rows currently 0 stances → full greenfield
  for the final ~5 current officials. Mayor Butts (since 2011, longest-serving) likely the richest record.
  Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration = 1018** (West Covina ended on-disk 1017; live `schema_migrations` MAX = 1011 — recent
  deep-seed structural migs applied live via MCP but the on-disk/committed counter leads; pre-flight MUST
  re-confirm BOTH).
- **COMMIT the migration files to the EV-Accounts repo** ([[feedback_no_git_in_ev_accounts]]) via
  `git -C "C:/EV-Accounts"` per the per-phase convention. DB applied live via Supabase MCP; FILES still committed.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government + the Eloy
  dedup is the hard requirement; headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152 idempotent patterns), survivor-chamber mechanics, shared-district
  split mechanics, per-member stance chairs, and which existing headshots pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 153: Inglewood deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — INGL-01 acceptance text

### Proven precedents to copy
- `.planning/phases/152-west-covina-deep-seed/` — most recent deep-seed; **same dual-chamber-merge + one-directional
  link repair + by-district relabel + shared-district-split + wrong-person-headshot lesson**.
- `.planning/phases/151-el-monte-deep-seed/` — the **directly-elected LOCAL_EXEC Mayor kept as-is + by-district**
  structure (Inglewood's closest structural analog) + official_count-excludes-Mayor convention.
- `C:/EV-Accounts/backend/migrations/1010_west_covina_reconcile.sql` + `1011_west_covina_complete.sql` — most
  recent idempotent dual-chamber-merge + link-repair + by-district relabel + shared-district-split templates.
- `C:/EV-Accounts/backend/migrations/1000_elmonte_reconcile.sql` / `1001_el_monte_complete.sql` — directly-elected
  Mayor + by-district + create-member templates (verify exact filenames at plan time).
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA', districts
  label column is `label`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase152_westcovina_complete` — immediately-prior deep-seed; dual-chamber merge + shared-district split + wrong-person headshot
- `project_phase151_elmonte_complete` — directly-elected Mayor + by-district + official_count convention
- `project_by_district_relabel_pattern` — by-district relabel mechanics
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed again for Inglewood)
- `feedback_no_git_in_ev_accounts`, `feedback_section_split_check`, `feedback_stance_*`,
  `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — discipline

### Live browse link (checkpoints / completion)
- `https://essentials.empowered.vote/results?browse_geo_id=0636546&browse_mtfcc=G4110`
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-21)

Gov: `City of Inglewood, California, US` = `af811c4b-e4da-4f30-ac33-9a7fe7d434ba`; geo_id NULL → `0636546`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `inglewood-city-council`):
- `a25a6dea-7f26-4f5e-bc6a-2a5d321063d5` (official_count 5) — 3 offices, **bidirectional-clean** = SURVIVOR:
  - Eloy **Morales** (666263, office `ddcd280b`, pol `6ed19c10`, At-Large LOCAL, 0 img, 0 stances) — DEDUP survivor
  - Dionne **Faulk** (666264, office `35b92278`, pol `729bc539`, At-Large LOCAL, **2 img → dedup**, 0 stances)
  - Gloria D. **Gray** (666261, office `8e9b0c61`, pol `7a04bf87`, At-Large LOCAL, 1 img, 0 stances)
- `8b99bcf0-813d-459a-b7e1-f82e12080ffc` (official_count NULL) — 3 offices, **one-directional** (pol.office_id NULL) = DOOMED:
  - James T. **Butts Jr.** (-200740, office `90121859`, pol `f5775ca1`, **Mayor / LOCAL_EXEC** 'Inglewood Mayor', 1 img, 0 stances) — KEEP as directly-elected Mayor
  - Eloy **Morales Jr.** (-201081, office `7fd55592`, pol `ff97a6bb`, At-Large LOCAL, **1 img**, 0 stances) — DEDUP dup (migrate photo → 666263, then unlink)
  - George **Dotson** (-201082, office `6b20a733`, pol `3e73448b`, At-Large LOCAL, 0 img, 0 stances) — suspected DEPARTED (verify)

Total = 6 offices / 6 rows; after Eloy dedup → 5 distinct people (Mayor + 4 districts). All council rows
`district_type='LOCAL'` label 'At-Large' (likely wrong — Inglewood is by-district; verify + relabel D1–4). Mayor
already LOCAL_EXEC (correct — Inglewood directly elects its Mayor; Butts since 2011). All 6 = 0 stances → Wave 4
full greenfield. Image gaps: Dotson 0, Eloy(666263) 0; Faulk has 2 (dedup).

Out-of-scope same-name gov: `3c4c8dca-894e-403f-8935-272989bc3c46` = Inglewood Unified School District.

Migration counter: on-disk MAX = 1017 (West Covina); live `schema_migrations` MAX = 1011. **Next migration = 1018**
(on-disk authoritative; pre-flight re-confirm both).
</code_context>

<specifics>
## Specific Ideas

- Operator approved the full reconcile approach 2026-06-21: Eloy Morales dedup (keep `666263`, migrate `-201081`
  photo, unlink dup, contingent on research confirming same person), by-district relabel D1–4 + keep Butts as
  directly-elected LOCAL_EXEC Mayor, research-verify roster + unlink departed (Dotson suspected), dedup Faulk
  photos + verify-and-fix, end-state Mayor + 4 districts = 5 offices, official_count=4.
- Wrong-person headshot guard carried forward from West Covina (the Brian-Gutierrez/soccer-player miss): verify
  each portrait is the actual Inglewood official.
</specifics>

<deferred>
## Deferred Ideas

- Inglewood Unified School District (gov `3c4c8dca`) — separate government, out of scope.
- Run Inglewood's own split-section check post-reconcile (expect 0 rows; Inglewood is NOT in the
  `project_split_section_defects_5_cities` set).
- The browse school-district-sliver display issue ([[project_browse_school_district_slivers]]) is a separate
  browse-logic follow-up, not part of this phase.
- Phase 157 (Wave-2 close-out) consumes Inglewood's final per-city counts.

None beyond the above — discussion stayed within phase scope.
</deferred>

---

*Phase: 153-inglewood-deep-seed*
*Context gathered: 2026-06-21 via /gsd-discuss-phase + live DB pre-check*
