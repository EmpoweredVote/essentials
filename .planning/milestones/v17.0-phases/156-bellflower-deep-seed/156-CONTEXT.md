# Phase 156: Bellflower deep-seed - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning
**Requirements:** BLFL-01
**Source:** /gsd-discuss-phase (live DB pre-check by orchestrator + operator-approved approach — all 4 gray areas selected, then "Lock all" with recommended defaults)

<domain>
## Phase Boundary

Take **City of Bellflower** (geo_id `0604982`, gov `d34bdac8-e928-45c5-aaa8-ca3950ec2d6c`) from a partial/defective
single-chamber seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same deep-seed pattern as phases 142–155. **Tier B (70k–100k pop).**

**⚠ Norwalk-class form-of-government anomaly, but SINGLE-CHAMBER (DB-confirmed 2026-06-22):** the City of Bellflower
gov already exists with `geo_id` NULL and **ONE 'City Council' chamber** (`a89b567a`, slug `bellflower-city-council`,
official_count NULL) holding **4 offices / 4 distinct people**. **No dual-chamber merge needed** (simpler than
Norwalk/Burbank). BUT three salient facts make this NOT a trivial reconcile:
1. **Likely-missing 5th member:** Bellflower councils normally seat **5**; only **4** are seated → research must
   verify the real current roster and seat the missing member.
2. **Separate LOCAL_EXEC Mayor office** (Ray Dunton, district "Bellflower Mayor" `b0002e15`) — the **same anomaly as
   Norwalk's Ayala**. Bellflower is a general-law CA city → almost certainly a ROTATIONAL mayor, making this Mayor
   office a probable mis-seed. **Form of government MUST be research-verified — no guessed default.**
3. **All 4 offices are one-directional** (`offices.politician_id` set, `politicians.office_id` NULL) → **repair all 4
   back-pointers** during the reconcile (the Lancaster/Burbank bidirectional-link trap).

All 4 occupants have 1 image / **0 stances** → Wave 3 = verify-and-fix images (+ fill the 5th); Wave 4 = full
greenfield stances.

**In scope:** City of Bellflower only. **NOT in scope:** `Bellflower Unified, California, US`
(`f85ca154-68c4-4cd5-92c0-adba01d992cc`) — separate school-district government.
</domain>

<decisions>
## Implementation Decisions

### Structure — single-chamber reconcile + geo_id backfill + back-pointer repair (Wave 1 — registers in schema_migrations)
- **D-01 (reconcile not greenfield; NO merge — single chamber):** Backfill
  `essentials.governments.geo_id='0604982'` on gov `d34bdac8` (guard `geo_id IS NULL OR geo_id=''`; state already CA).
  There is exactly ONE 'City Council' chamber (`a89b567a`) — **no merge, no doomed-chamber delete**. Repair the **4
  one-directional back-pointers** (set `politicians.office_id` to match each office's `politician_id`) for Koops,
  Morse, Sanchez, and Dunton (the Lancaster/Burbank trap, [[project_v170_wave2_not_greenfield]]).
  - **Title normalization:** the 3 council offices use `'Council Member'` (with space) — normalize all council titles
    to **`'Councilmember'`** (Santa Clarita 143 precedent). The Mayor office title resolved per D-02.
  - Set chamber `official_count` per D-02 outcome (5 if rotational-mayor council-only count; if a genuinely
    directly-elected Mayor is confirmed, council seats counted separately with Mayor excluded — El Monte convention).
  - At-Large district = `8db5a2e5-2172-474a-be23-e51c2a53f970` (CA, LOCAL) — holds all 3 current council seats; the
    converted Mayor seat + the new 5th member attach here (if rotational confirmed). No district consolidation needed
    (single At-Large district already).
  - Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, chamber UUID, the 4 offices + members/ext_ids, all 4 link
    directions, both district UUIDs (At-Large `8db5a2e5` + Mayor LOCAL_EXEC `b0002e15`), and live `schema_migrations`
    MAX + on-disk MAX.

### Form of government (Wave 1/2 — DEFER TO RESEARCH, NO guessed default)
- **D-02 (research-verify mayor type + at-large/by-district — no guessed default):** DB currently models Bellflower as
  a **directly-elected LOCAL_EXEC Mayor** (Ray Dunton, district "Bellflower Mayor" `b0002e15`) **+ 3 At-Large council**
  = 4 seats. **MANDATORY (the Norwalk/Downey/El Monte lesson, [[project_phase155_norwalk_complete]],
  [[project_phase150_downey_complete]], [[project_by_district_relabel_pattern]]): research MUST verify the form of
  government against the OFFICIAL city site (bellflowerca.gov / cityofbellflower.org) before committing** —
  (a) at-large vs by-district (CVRA — if Bellflower switched to districts, relabel At-Large → District N by verified
  per-person map and split the shared district_id), and (b) directly-elected Mayor vs rotational mayor.
  **Working hypothesis to confirm/refute (NOT a default): Bellflower is a general-law CA city → ROTATIONAL mayor
  selected annually by/from the council** — which would make the existing separate LOCAL_EXEC Mayor office a mis-seed.
  - **If research finds rotational mayor (hypothesis confirmed):** Bellflower has **5 at-large council seats**, one of
    whom holds the rotational Mayor title. Convert Dunton's separate Mayor LOCAL_EXEC office into a council seat on the
    chamber/At-Large district `8db5a2e5`, and set the current rotational Mayor as a **title on that person's council
    seat** (Norwalk 155 / Downey 150 / West Covina 152 precedent — do NOT keep a separate LOCAL_EXEC Mayor office).
    Drop the orphan "Bellflower Mayor" LOCAL_EXEC district `b0002e15`. Seat the missing 5th member (D-03).
    `official_count=5`.
  - **If research finds a genuinely directly-elected Mayor:** keep the Mayor as a LOCAL_EXEC office
    (El Monte/Inglewood/Lancaster model), council seats counted separately (Mayor excluded — El Monte convention).
  - **If research finds by-district:** relabel + split per the West Covina/Inglewood pattern.

### Roster — verify currency + seat the likely-missing 5th (Wave 2 — registers in schema_migrations)
- **D-03 (research-verify the full council; seat missing 5th; unlink-not-delete departed; new members -7010xx):** The 4
  current DB occupants — Ray **Dunton** (-200583, Mayor), Dan **Koops** (-201149), Wendi **Morse** (-201150),
  Victor A. **Sanchez** (-201151) [all four one-directional, negative ext_id] — are **SUSPECT until verified against
  bellflowerca.gov** (bulk-seeded; Bellflower had a **Nov-2024 election** — turnover possible). Only 4 of a normal 5
  are seated → **research MUST identify the missing 5th current member and seat them** (create fresh with a new
  negative ext_id, `-7010xx` scheme; query `MIN(external_id)` to avoid collision). For any seeded person who is NOT a
  current member (departed/defeated): **unlink-not-delete** (null the office↔politician link both directions, KEEP the
  politician + any stance/photo rows — Whittier/SM/Downey/El Monte/Inglewood/Norwalk precedent). The ~25
  `'... FOR BELLFLOWER ...'` rows (ext_id NULL, is_active=false) are **campaign-finance committees, NOT politicians —
  ignore them** (Lancaster lesson); likewise the school-board row "Daniel Allen Buffington To Bellflower Unified
  School District School Board" is out of scope. Set chamber `official_count` per D-02.

### Headshots (Wave 3 — verify-and-fix the 4 existing + fill the 5th, audit-only migration)
- **D-04 (verify-and-fix the 4 existing + fill the 5th honestly):** Image state — all 4 current occupants have exactly
  1 image (Dunton, Koops, Morse, Sanchez). For each CURRENT official (after the D-03 roster verify): verify correct
  person, no superimposed text/graphics ([[feedback_headshot_no_graphics]]), **600×750** 4:5
  ([[feedback_headshot_image_sizing]]). Re-crop/replace any existing image that fails. Fill the gap for the
  newly-seated 5th member from bellflowerca.gov (**WAF status UNKNOWN — check**; many LA-area .gov sites are WAF-403
  e.g. Downey/Glendale/Pomona; others NO-WAF CivicEngage/Revize). Operator in-browser fallback if WAF-403; alternate
  hosts (Ballotpedia/SCAG/Wikimedia/campaign) otherwise. Crop 4:5 FIRST → 600×750 Lanczos q90
  ([[feedback_headshot_resize_no_distort]]), upload `politician_photos/{uuid}-headshot.jpg` (x-upsert),
  `type='default'`, real `photo_license` + `photo_origin_url`. Honest gap if no acceptable portrait. Blocking
  human-verify checkpoint. **⚠ Wrong-person guard (the West Covina lesson): verify each image is the actual Bellflower
  official, not a name-collision.**

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–155):** evidence-only **CHAIRS** model (value = the chair the evidence matches,
  never a polarity axis — [[feedback_compass_chairs_not_polarity]]); 100% citation (paired `inform.politician_answers`
  + `inform.politician_context` with reasoning + real source URLs); **no defaulted/neutral values**
  ([[feedback_stance_no_default_value]]); honest blank spokes; research ALL non-judicial compass topics
  ([[feedback_stance_research_all_topics]]); **NO judicial-* topics** (Bellflower is council-manager with an appointed
  City Attorney); live non-judicial topics queried at apply time (never hardcode retired IDs —
  [[project_compass_live_topic_ids]]); **ONE research agent at a time** ([[feedback_stance_research_one_at_a_time]]);
  rent-regulation only-if-real-evidence (no manufactured RSO). All 4 rows currently 0 stances; the 5th member starts
  at 0 → full greenfield for the current officials. Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot + stance
  migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration = 1042** (Norwalk ended on-disk 1041; live integer `schema_migrations` MAX lags — recent
  structural migs applied live via MCP with timestamp versions, but the on-disk/committed counter leads; pre-flight
  MUST re-confirm BOTH).
- **COMMIT the migration files to the EV-Accounts repo** ([[feedback_no_git_in_ev_accounts]]) via
  `git -C "C:/EV-Accounts"` per the per-phase convention. DB applied live via Supabase MCP; FILES still committed.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government (the back-pointer
  repair + Dunton mayor-type resolution + missing-5th seating + roster verification) is the hard requirement; headshot
  gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153/154/155 idempotent patterns), back-pointer-repair mechanics,
  Mayor-office conversion mechanics (if D-02 finds rotational), per-member stance chairs, and which existing headshots
  pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 156: Bellflower deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — BLFL-01 acceptance text

### Proven precedents to copy
- `.planning/phases/155-norwalk-deep-seed/` — immediately-prior deep-seed; **same separate-LOCAL_EXEC-Mayor anomaly +
  one-directional link repair + geo_id backfill + rotational-mayor-as-title conversion**. Bellflower differs: SINGLE
  chamber (no merge) and a likely-missing 5th member to seat.
- `.planning/phases/150-downey-deep-seed/` — **rotational mayor = title on a council seat** (Bellflower's model if
  research confirms rotational); verify mayor on official city site (Downey research was initially wrong).
- `.planning/phases/152-west-covina-deep-seed/` — wrong-person headshot lesson; by-district handling (if CVRA found).
- `.planning/phases/145-lancaster-deep-seed/` — directly-elected Mayor (LOCAL_EXEC) model + bidirectional-link-trap
  repair + ignore campaign-finance-committee rows (relevant if research finds directly-elected Mayor).
- `C:/EV-Accounts/backend/migrations/1034_norwalk_reconcile.sql` + `1035_norwalk_complete.sql` — most recent
  idempotent reconcile + one-directional link-repair + rotational-mayor-conversion + roster templates.
- `C:/EV-Accounts/backend/migrations/1036_norwalk_headshots.sql` — most recent headshot audit-only template.
- `C:/EV-Accounts/backend/migrations/1037_norwalk_*_stances.sql` (one-per-member) — most recent stance audit-only
  templates.
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA', districts
  label column is `label`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase155_norwalk_complete` — immediately-prior deep-seed; separate-Mayor anomaly + one-directional repair +
  geo_id backfill + rotational-mayor-as-title + inform compass schema notes (compass_topics.topic_key/is_live +
  compass_stances chairs + politician_answers/context)
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed again for Bellflower: gov + chamber +
  4 offices pre-existed); bidirectional-link trap; ignore committee rows
- `project_phase150_downey_complete` — rotational mayor = title on seat; verify mayor on official site
- `project_by_district_relabel_pattern` — by-district relabel mechanics (only if research finds Bellflower is
  by-district)
- `feedback_no_git_in_ev_accounts`, `feedback_section_split_check`, `feedback_stance_*`,
  `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — discipline

### Live browse link (checkpoints / completion)
- `https://essentials.empowered.vote/results?browse_geo_id=0604982&browse_mtfcc=G4110`
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-22)

Gov: `City of Bellflower, California, US` = `d34bdac8-e928-45c5-aaa8-ca3950ec2d6c`; geo_id NULL → `0604982`; state CA.

ONE 'City Council' chamber under that gov (NO merge):
- `a89b567a-6085-44c0-94ce-2a922ebb1fa6` (external_id -200581, official_count **NULL**, slug `bellflower-city-council`,
  name_formal 'Bellflower City Council') — 4 offices, **all one-directional** (pol.office_id NULL → repair back-pointers):
  - Ray **Dunton** (-200583, pol `31c35458-6cc0-43ad-b431-841846e81875`, office `bdd2040f-8f8d-4543-b017-3caad9be4510`,
    **Mayor** LOCAL_EXEC, district "Bellflower Mayor" `b0002e15-e006-4791-b2f7-7a3389f58cb3`, 1 img, 0 stances) — repair
    link; mayor-type pending D-02
  - Dan **Koops** (-201149, pol `dd2c2cfd-401f-4b35-916f-caba8ca9b722`, office `3935cd4b-727b-41fb-96c3-87f66b0c385c`,
    Council Member At-Large, 1 img, 0 stances) — repair link
  - Wendi **Morse** (-201150, pol `d18dcb81-ad41-468f-9b12-a70ed21fd3a7`, office `7408185f-600c-4b02-8949-431347f21390`,
    Council Member At-Large, 1 img, 0 stances) — repair link
  - Victor A. **Sanchez** (-201151, pol `4384a5d8-68b2-4e24-81e2-5208f5c61a34`, office
    `581c5602-b72c-49f6-8b6e-c3e653eefbce`, Council Member At-Large, 1 img, 0 stances) — repair link

At-Large district = `8db5a2e5-2172-474a-be23-e51c2a53f970` (CA, LOCAL) holds the 3 council seats. Mayor LOCAL_EXEC
district = `b0002e15-e006-4791-b2f7-7a3389f58cb3` ("Bellflower Mayor", 1 office) — drop after Mayor-office conversion
if D-02 finds rotational.

Total = 4 offices / 4 distinct people. **Council normally seats 5 → 1 member likely missing** (research must seat the
5th). Title drift: 3 council offices use 'Council Member' (with space) → normalize to 'Councilmember'. All 4 = 0
stances → Wave 4 full greenfield. Images: 4/4 have 1 each.

Office-unlinked rows tied to Bellflower are all campaign-finance committees (ext_id NULL, is_active=false) — NOT
politicians, ignore (Lancaster rule). One out-of-scope active row "Daniel Allen Buffington To Bellflower Unified
School District School Board" (school board, ext_id NULL) — ignore. No genuine office-unlinked City-Council
politician rows to reseat.

Out-of-scope same-name gov: `f85ca154-68c4-4cd5-92c0-adba01d992cc` = Bellflower Unified School District.

Migration counter: on-disk MAX = 1041 (Norwalk); live integer `schema_migrations` lags (timestamp-versioned recents).
**Next migration = 1042** (on-disk authoritative; pre-flight re-confirm both).
</code_context>

<specifics>
## Specific Ideas

- Operator approved the full reconcile approach 2026-06-22 (selected all 4 gray areas, then "Lock all" = accept the
  recommended defaults): single-chamber reconcile (NO merge) with one-directional back-pointer repair for Dunton +
  Koops + Morse + Sanchez, geo_id backfill, title normalization to 'Councilmember'; research-verify form of government
  (mayor type + at-large/by-district) against bellflowerca.gov with NO guessed default (hypothesis = general-law
  rotational mayor → convert Dunton's Mayor LOCAL_EXEC office to a council seat with mayor-as-title); research-verify
  the roster and **seat the likely-missing 5th member** (Nov-2024 turnover possible; unlink-not-delete departed; new
  members -7010xx); headshot verify-and-fix the 4 existing + fill the 5th; evidence-only stances full greenfield for
  the current officials.
- Wrong-person headshot guard carried forward from West Covina: verify each portrait is the actual Bellflower official,
  not a name-collision.
- Bellflower's existing separate LOCAL_EXEC Mayor office (Ray Dunton) is the salient anomaly (same shape as Norwalk's
  Ayala) — resolve it via research, do NOT assume it is correct and do NOT assume it is wrong.
- The under-count (4 of 5 seats) is the second salient anomaly — research must find and seat the 5th current member.
</specifics>

<deferred>
## Deferred Ideas

- Bellflower Unified School District (gov `f85ca154`) — separate government, out of scope.
- Run Bellflower's own split-section check post-reconcile (expect 0 rows — single chamber, single At-Large district;
  Bellflower is NOT in the `project_split_section_defects_5_cities` set).
- The browse school-district-sliver display issue ([[project_browse_school_district_slivers]]) is a separate
  browse-logic follow-up, not part of this phase.
- Phase 157 (Wave-2 LAC2-RETRO close-out) consumes Bellflower's final per-city counts.

None beyond the above — discussion stayed within phase scope.

</deferred>

---

*Phase: 156-bellflower-deep-seed*
*Context gathered: 2026-06-22 via /gsd-discuss-phase + live DB pre-check*
