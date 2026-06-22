# Phase 154: Burbank deep-seed - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Requirements:** BURB-01
**Source:** /gsd-discuss-phase (live DB pre-check by orchestrator + operator-approved approach — all 3 gray areas locked with recommended defaults)

<domain>
## Phase Boundary

Take **City of Burbank** (geo_id `0608954`, gov `3e3deaea-c5f4-4a68-b3ae-a79589f544ea`) from a partial/defective
seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only compass
stances. Same 4-wave deep-seed pattern as phases 142–153.

**⚠ Dual-chamber reconcile (DB-confirmed 2026-06-21), simpler than Inglewood:** the City of Burbank gov already
exists with `geo_id` NULL and **two duplicate 'City Council' chambers** (both slug `burbank-city-council`),
holding **5 offices / 5 distinct people** total. NO duplicate-person dedup (unlike Inglewood's Eloy). All 5 rows
are labeled `At-Large` and all 5 have **0 stances** (Wave 4 = full greenfield). **There is NO Mayor office at all** —
Burbank is believed at-large with a **rotational mayor** (the West Covina/Downey model, NOT Inglewood/El Monte's
directly-elected LOCAL_EXEC Mayor). Form of government MUST be research-verified — no guessed default.

**In scope:** City of Burbank only. **NOT in scope:** `Burbank Unified, California, US`
(`d5ffbb65-f0db-41ad-8d11-278b8fb9aedc`) — separate school-district government.
</domain>

<decisions>
## Implementation Decisions

### Structure — dual-chamber merge + geo_id backfill (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0608954'` on gov `3e3deaea`
  (guard `geo_id IS NULL OR geo_id=''`; state already CA), then merge the two duplicate 'City Council' chambers
  into ONE via move-then-delete (UUID-targeted — both share name 'City Council' / slug `burbank-city-council`;
  assert doomed empty before delete):
  - **SURVIVOR = `73422d25-c0a6-477a-b74f-2b38b94b6389`** (official_count **5**, 3 offices, **bidirectional-clean**
    — pol.office_id set). Its At-Large district = `15458750-78aa-4b9a-ade4-247e28bc25c2` (CA, 3 offices) = the
    surviving At-Large district.
  - **DOOMED = `6a72dbe8-06fa-4148-9152-1c8e2f11b30e`** (official_count NULL, 2 offices, **one-directional** —
    pol.office_id NULL). Its At-Large district = `809bbb35-8d84-4e51-aef8-44547b32d063` (CA, 2 offices).
  - Move the 2 doomed-chamber offices (Konstantine Anthony, Zizette Mullins) into the survivor chamber, **repair
    their one-directional links** (set `politicians.office_id` to match `offices.politician_id`), and **re-point
    them to the survivor At-Large district `15458750`**. Then delete the empty doomed chamber + the now-orphaned
    doomed At-Large district `809bbb35`. End-state = ONE chamber, ONE At-Large district holding all current
    at-large seats (correct for an at-large city — this is NOT the by-district shared-district defect).
  - Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, both chamber UUIDs, the 5 offices + members/ext_ids,
    both link directions, the two At-Large district UUIDs, and live `schema_migrations` MAX + on-disk MAX.

### Form of government (Wave 1/2 — DEFER TO RESEARCH, NO guessed default)
- **D-02 (at-large + rotational mayor — verify vs official site; recommended default):** DB shows 5 `At-Large`
  council rows and **NO Mayor office**. Burbank is believed **at-large** (5 council members elected citywide) with
  a **rotational mayor** chosen annually by/from the council (the West Covina 152 / Downey 150 model — mayor is a
  TITLE on a council seat, not a separate LOCAL_EXEC office). **MANDATORY (the Downey/El Monte lesson,
  [[project_phase150_downey_complete]], [[project_by_district_relabel_pattern]]): research MUST verify the form of
  government against the OFFICIAL city site (burbankca.gov) before committing — (a) at-large vs by-district (Burbank
  may have switched to districts under CVRA — if so, relabel At-Large → District N by verified per-person map and
  split the shared district_id), and (b) rotational mayor vs directly-elected Mayor.** No guessed default.
  - If confirmed at-large + rotational: keep all 5 as At-Large council seats, set the current rotational Mayor as a
    **title on that person's existing seat** (Downey/West Covina precedent — do NOT create a separate LOCAL_EXEC
    Mayor office). `official_count=5`.
  - If research finds a directly-elected Mayor: create/keep it as a LOCAL_EXEC office (El Monte/Inglewood model) and
    set `official_count` for the council seats only (Mayor excluded — El Monte convention).
  - If research finds by-district: relabel + split per the West Covina/Inglewood pattern.

### Roster — verify currency + the Mullins suspect (Wave 2 — registers in schema_migrations)
- **D-03 (research-verify all 5; unlink-not-delete departed/non-members; official_count=5):** The 5 current DB
  occupants — Nikki Perez (663414), Christopher John Rizzotti (663419), Tamala Takahashi (663418) [the bidirectional
  positive-ext_id trio], Konstantine Anthony (-201161), Zizette Mullins (-201162) [the one-directional negative-ext_id
  pair] — are **SUSPECT until verified against burbankca.gov**. **⚠ Zizette Mullins is very likely Burbank's City
  CLERK, not a council member** — prime suspect for a wrong/non-member row. Research MUST confirm the 5 current
  council members. For any seeded person who is NOT a current councilmember (Mullins prime suspect, or any departed
  member): **unlink-not-delete** (null the office↔politician link both directions, KEEP the politician + any
  stance/photo rows — Whittier/SM/Downey/El Monte/Inglewood precedent). Any genuinely-new current member created
  fresh gets a new negative ext_id (`-7010xx` scheme; query MIN(external_id) to avoid collision). Set survivor
  chamber `official_count=5` (Burbank council = 5 at-large seats; adjust only if D-02 research finds a separately-
  counted directly-elected Mayor).

### Headshots (Wave 3 — verify-and-fix + fill gaps, audit-only migration)
- **D-04 (verify-and-fix 3 existing + fill 2 gaps honestly):** Image state — Perez 1, Anthony 1, Mullins 1,
  Rizzotti **0**, Takahashi **0**. For each CURRENT official (after the roster verify): verify correct person, no
  superimposed text/graphics ([[feedback_headshot_no_graphics]]), **600×750** 4:5 ([[feedback_headshot_image_sizing]]).
  Re-crop/replace any existing image that fails. Fill the 0-image gaps (Rizzotti, Takahashi, + any newly-seeded
  member) from burbankca.gov (**WAF status UNKNOWN — check**; many LA-area .gov sites are WAF-403 e.g. Downey/
  Glendale/Pomona; West Covina/El Monte were NO-WAF CivicEngage). Operator in-browser fallback if WAF-403;
  alternate hosts (Ballotpedia/SCAG/Wikimedia/campaign) otherwise. Crop 4:5 FIRST → 600×750 Lanczos q90
  ([[feedback_headshot_resize_no_distort]]), upload `politician_photos/{uuid}-headshot.jpg` (x-upsert),
  `type='default'`, real `photo_license` + `photo_origin_url`. Honest gap if no acceptable portrait. Blocking
  human-verify checkpoint. **⚠ Wrong-person guard (the West Covina lesson): verify each image is the actual Burbank
  official, not a name-collision** (e.g. don't pull a different Konstantine Anthony / Nikki Perez).

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–153):** evidence-only **CHAIRS** model (value = the chair the evidence matches,
  never a polarity axis — [[feedback_compass_chairs_not_polarity]]); 100% citation (paired
  `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs); **no
  defaulted/neutral values** ([[feedback_stance_no_default_value]]); honest blank spokes; research ALL non-judicial
  compass topics ([[feedback_stance_research_all_topics]]); **NO judicial-* topics** (Burbank is council-manager
  with an appointed City Attorney); live non-judicial topics queried at apply time (never hardcode retired IDs —
  [[project_compass_live_topic_ids]]); **ONE research agent at a time** ([[feedback_stance_research_one_at_a_time]]);
  rent-regulation only-if-real-evidence (no manufactured RSO). All 5 rows currently 0 stances → full greenfield for
  the 5 current officials. Konstantine Anthony (longer-tenured, former mayor) likely the richest record.
  Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration = 1026** (Inglewood ended on-disk 1025; live `schema_migrations` MAX = 999 — recent deep-seed
  structural migs applied live via MCP but the on-disk/committed counter leads; pre-flight MUST re-confirm BOTH).
- **COMMIT the migration files to the EV-Accounts repo** ([[feedback_no_git_in_ev_accounts]]) via
  `git -C "C:/EV-Accounts"` per the per-phase convention. DB applied live via Supabase MCP; FILES still committed.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government (the
  dual-chamber merge + link repair + Mullins/roster verification) is the hard requirement; headshot gaps and
  thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153 idempotent patterns), survivor-chamber move-then-delete
  mechanics, At-Large district consolidation mechanics, per-member stance chairs, and which existing headshots
  pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 154: Burbank deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — BURB-01 acceptance text

### Proven precedents to copy
- `.planning/phases/153-inglewood-deep-seed/` — immediately-prior deep-seed; **same dual-chamber-merge +
  one-directional link repair + geo_id backfill** (Burbank is simpler: no person-dedup, likely at-large not
  by-district).
- `.planning/phases/152-west-covina-deep-seed/` — dual-chamber merge + **rotational-mayor handling** + wrong-person
  headshot lesson.
- `.planning/phases/150-downey-deep-seed/` — **rotational mayor = title on a council seat** (Burbank's closest
  structural analog if at-large + rotational confirmed); verify mayor on official city site (Downey research was wrong).
- `C:/EV-Accounts/backend/migrations/1018_inglewood_reconcile.sql` + `1019_inglewood_complete.sql` — most recent
  idempotent dual-chamber-merge + one-directional link-repair + roster templates.
- `C:/EV-Accounts/backend/migrations/1010_west_covina_reconcile.sql` / `1011_west_covina_complete.sql` —
  dual-chamber merge + rotational mayor templates (verify exact filenames at plan time).
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA', districts
  label column is `label`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase153_inglewood_complete` — immediately-prior deep-seed; dual-chamber merge + one-directional repair + geo_id backfill
- `project_phase152_westcovina_complete` — dual-chamber merge + wrong-person headshot guard
- `project_phase150_downey_complete` — rotational mayor = title on seat; verify mayor on official site
- `project_by_district_relabel_pattern` — by-district relabel mechanics (only if research finds Burbank is by-district)
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed again for Burbank: gov + 2 chambers pre-existed)
- `feedback_no_git_in_ev_accounts`, `feedback_section_split_check`, `feedback_stance_*`,
  `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — discipline

### Live browse link (checkpoints / completion)
- `https://essentials.empowered.vote/results?browse_geo_id=0608954&browse_mtfcc=G4110`
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-21)

Gov: `City of Burbank, California, US` = `3e3deaea-c5f4-4a68-b3ae-a79589f544ea`; geo_id NULL → `0608954`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `burbank-city-council`):
- `73422d25-c0a6-477a-b74f-2b38b94b6389` (official_count **5**) — 3 offices, **bidirectional-clean** = SURVIVOR.
  At-Large district `15458750-78aa-4b9a-ade4-247e28bc25c2` (CA, 3 offices) = surviving district:
  - Nikki **Perez** (663414, pol `96f91743-def6-436c-9537-a4b836c1b3eb`, office `f205911b`, At-Large, 1 img, 0 stances)
  - Christopher John **Rizzotti** (663419, pol `a83a63a8-3e0f-4a2e-9226-8c0cd26a1349`, office `caea9243`, At-Large, **0 img**, 0 stances)
  - Tamala **Takahashi** (663418, pol `ea6f7109-6067-4a48-bbdf-2a8b9cffe05f`, office `70e56076`, At-Large, **0 img**, 0 stances)
- `6a72dbe8-06fa-4148-9152-1c8e2f11b30e` (official_count NULL) — 2 offices, **one-directional** (pol.office_id NULL) = DOOMED.
  At-Large district `809bbb35-8d84-4e51-aef8-44547b32d063` (CA, 2 offices) = doomed district (drop after move):
  - Konstantine **Anthony** (-201161, pol `6c4c7919-3e7f-41fa-8b1b-1c8b421fe4a7`, office `1294961c`, At-Large, 1 img, 0 stances) — repair link, move to survivor
  - Zizette **Mullins** (-201162, pol `f933bd87-d397-4ef1-873b-57559b629000`, office `9969febe`, At-Large, 1 img, 0 stances) — **SUSPECT: likely City Clerk, not councilmember — research-verify; unlink-not-delete if not current member**

Total = 5 offices / 5 distinct people (no person-dedup needed). All `At-Large`. **NO Mayor office exists.** All 5 =
0 stances → Wave 4 full greenfield. Image gaps: Rizzotti 0, Takahashi 0.

Out-of-scope same-name gov: `d5ffbb65-f0db-41ad-8d11-278b8fb9aedc` = Burbank Unified School District (chamber
`d0e08b39` Board of Education).

Migration counter: on-disk MAX = 1025 (Inglewood); live `schema_migrations` MAX = 999. **Next migration = 1026**
(on-disk authoritative; pre-flight re-confirm both).
</code_context>

<specifics>
## Specific Ideas

- Operator approved the full reconcile approach 2026-06-21 (selected all 3 gray areas + "all locked", i.e. accept
  the recommended defaults): dual-chamber merge into the bidirectional official_count=5 survivor `73422d25` with
  one-directional link repair for Anthony + Mullins, geo_id backfill, At-Large district consolidation; research-
  verify form of government (default at-large + rotational-mayor-as-title, NOT directly-elected — no guessed
  default); research-verify the 5-member roster (Zizette Mullins prime suspect for City-Clerk-not-councilmember,
  unlink-not-delete if confirmed); headshot verify-and-fix the 3 existing + fill the 2 gaps (Rizzotti, Takahashi);
  evidence-only stances full greenfield for all 5.
- Wrong-person headshot guard carried forward from West Covina: verify each portrait is the actual Burbank official,
  not a name-collision.
- Burbank's mayor is almost certainly rotational (no separate Mayor office in DB) — do NOT invent a directly-elected
  Mayor; verify and represent as a title on the current mayor's council seat (Downey/West Covina precedent).
</specifics>

<deferred>
## Deferred Ideas

- Burbank Unified School District (gov `d5ffbb65`) — separate government, out of scope.
- Run Burbank's own split-section check post-reconcile (expect 0 rows once consolidated to one At-Large district;
  Burbank is NOT in the `project_split_section_defects_5_cities` set).
- The browse school-district-sliver display issue ([[project_browse_school_district_slivers]]) is a separate
  browse-logic follow-up, not part of this phase.
- Phase 157 (Wave-2 close-out) consumes Burbank's final per-city counts.

None beyond the above — discussion stayed within phase scope.
</deferred>

---

*Phase: 154-burbank-deep-seed*
*Context gathered: 2026-06-21 via /gsd-discuss-phase + live DB pre-check*
