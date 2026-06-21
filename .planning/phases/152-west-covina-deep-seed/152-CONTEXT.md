# Phase 152: West Covina deep-seed - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Requirements:** WCOV-01
**Source:** Live DB pre-check (orchestrator, Supabase MCP) — discuss-phase skipped by operator; pattern locked by phases 142–151

<domain>
## Phase Boundary

Take **City of West Covina** (geo_id `0684200`, gov `1982a9fa-dc56-482d-83fc-27bf69458b22`) from a partial/
defective seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same 4-wave deep-seed pattern as phases 142–151.

**⚠ This is a RECONCILE, not greenfield (DB-confirmed 2026-06-21):** the West Covina city gov already exists with
`geo_id` NULL and **two duplicate 'City Council' chambers** (both slug `west-covina-city-council`), holding 5
council offices total / 5 distinct politicians. There is **no separate Mayor office** (West Covina's mayor is
believed rotational — a title held by one sitting councilmember, council-selected — UNLIKE El Monte's directly-
elected LOCAL_EXEC mayor).

**In scope:** City of West Covina only. **NOT in scope:** `West Covina Unified, California, US`
(`131e33d0-e40a-4aaf-bc8d-c665750d1b6d`) — that is the **West Covina Unified School District**, a separate
government.
</domain>

<decisions>
## Implementation Decisions

### Structure (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0684200'` on gov `1982a9fa`
  (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers
  (`12c9360a` official_count 5 / 3 offices + `b1a2c4cb` official_count NULL / 2 offices) into ONE via
  move-then-delete (UUID-targeted — both share name 'City Council' / slug `west-covina-city-council`; assert the
  doomed chamber is empty before delete). Follow the El Monte (151) / Pasadena (146) dual-chamber merge template.
  A Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, both chamber UUIDs, the 5 offices + members/ext_ids,
  **both link directions** (see D-01b), and the live `schema_migrations` MAX + on-disk file MAX before numbering.
- **D-01b (repair one-directional links):** Chamber `b1a2c4cb`'s two offices have `offices.politician_id` set
  (Rosario Diaz `f5bf4ec4`, Brian Gutierrez `22fc2cdc`) but the reverse `politicians.office_id` is **NULL** — a
  one-directional link defect. Chamber `12c9360a`'s three offices are bidirectional and clean. The merge MUST
  leave the survivor chamber with consistent **bidirectional** office↔politician links for all 5 seats
  (set `politicians.office_id` to match `offices.politician_id`).

### Form of government (Wave 1 — DEFERRED TO RESEARCH, NO guessed default)
- **D-02 (form of government — RESEARCH MUST VERIFY against official site, no default):** The DB shows **5
  At-Large council seats** (`district_type='LOCAL'`, label 'At-Large') and **no separate mayor**. West Covina
  faced a **CVRA / California Voting Rights Act** challenge — it may have transitioned to **by-district**
  elections (the Downey 150 / Palmdale 146 / El Monte-Cortez model), OR it may still be At-Large (the Torrance
  148 model). **MANDATORY (the Phase-150 Downey lesson — see [[project_phase150_downey_complete]] and
  [[project_by_district_relabel_pattern]]): research MUST verify West Covina's current form of government, seat
  count, and per-seat district assignments AND the current mayor's identity against the OFFICIAL city site
  (westcovina.org) before committing. Do NOT guess a default.**
  - If **by-district**: relabel the existing At-Large rows to occupant districts + create any missing district
    seats (the proven Phase-146 by-district relabel pattern, [[project_by_district_relabel_pattern]]). Rotational
    mayor = a title on the seat, NOT a separate office.
  - If **At-Large**: keep At-Large labels (the Torrance 148 "stay At-Large" precedent). Rotational mayor still a
    title on a seat.

### Roster (Wave 2 — verify count + currency, registers in schema_migrations)
- **D-03 (current-seated, retire departed):** 5 council offices are seeded:
  - Letty **Lopez-Viado** (ext_id 687361, pol `2872d7a4`, office `4a8f2fd6`, At-Large, img 1, 0 stances)
  - Ollie **Cantos** (ext_id 687365, pol `ecc57cd4`, office `50471af9`, At-Large, img 1, 0 stances)
  - Tony **Wu** (ext_id 687367, pol `1bb5c062`, office `65bf4e71`, At-Large, img 1, 0 stances)
  - Rosario **Diaz** (ext_id -201107, pol `f5bf4ec4`, office `abd27abb`, At-Large, img 1, 0 stances)
  - Brian **Gutierrez** (ext_id -201108, pol `22fc2cdc`, office `0f3cce5f`, At-Large, img 1, 0 stances)

  West Covina's real council is a **5-seat body**, so the seat count looks right — but **treat the roster as
  SUSPECT** (names/seats may be stale) until verified against westcovina.org. Confirm current holders + which
  seat/district each holds today; identify the current **Mayor** (title on a seat). **Unlink-not-delete** any
  departed member (null the office↔politician link both directions, keep politician + stance + photo rows —
  Whittier/Santa Monica/Downey/El Monte precedent). New seats created fresh get a new negative ext_id (continue
  the `-7010xx` scheme used since El Monte's Cortez `-701001`; pre-flight MUST query MIN(external_id) to avoid
  collision). Set `official_count` on the survivor chamber to the verified council size (currently 5 and NULL —
  both stale/wrong).

### Headshots (Wave 3 — verify existing, audit-only migration)
- **D-04 (verify-first; all 5 already have an image):** All 5 officials already have 1 `politician_images` row
  (pre-existing, dimensions UNVERIFIED). For each CURRENT official: verify the image is the correct person, has
  no superimposed text/graphics ([[feedback_headshot_no_graphics]]), and is **600×750** (4:5,
  [[feedback_headshot_image_sizing]]). Keep good ones as-is; **re-crop/re-source only those that fail** (wrong
  person, wrong dimensions, low quality, or stale departed member). Try direct curl from westcovina.org first
  (WAF status UNKNOWN — check; many LA-area .org/.gov city sites are WAF-403, e.g. Downey/Glendale/Pomona);
  operator in-browser fallback if WAF-403; alternate hosts (Ballotpedia/SCAG/Wikimedia/campaign) otherwise. Crop
  4:5 FIRST → 600×750 Lanczos q90 ([[feedback_headshot_resize_no_distort]]), upload to
  `politician_photos/{uuid}-headshot.jpg` (x-upsert), `type='default'`, real `photo_license` + `photo_origin_url`.
  Honest gap if no acceptable portrait. Blocking human-verify checkpoint.

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–151, not re-discussed):** evidence-only **CHAIRS** model (value = the chair
  the evidence matches, never a polarity axis — [[feedback_compass_chairs_not_polarity]]); 100% citation (paired
  `inform.politician_answers` + `inform.politician_context` with reasoning + real source URLs); **no
  defaulted/neutral values** ([[feedback_stance_no_default_value]]); honest blank spokes; research ALL compass
  topics ([[feedback_stance_research_all_topics]]); **NO judicial-* topics** (West Covina is council-manager);
  live non-judicial topics queried at apply time (never hardcode retired IDs —
  [[project_compass_live_topic_ids]]); **ONE research agent at a time** ([[feedback_stance_research_one_at_a_time]]).
  All 5 officials currently have 0 stances → full greenfield. Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). **On-disk file counter is authoritative.**
  **Next migration = 1010** (El Monte ended at on-disk 1009; live `schema_migrations` MAX = 999 — the recent
  deep-seed structural migs are applied live via MCP but the on-disk/committed file counter leads). Pre-flight
  MUST re-confirm live `schema_migrations` MAX + on-disk MAX before numbering (beware other workstreams advancing
  the counter).
- **COMMIT the migration files to the EV-Accounts repo as part of this phase** ([[feedback_no_git_in_ev_accounts]])
  — `git -C "C:/EV-Accounts" add backend/migrations/<files>` + commit per the per-phase convention. DB is applied
  live via Supabase MCP; the FILES still need committing.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government is the hard
  requirement; headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Survivor-chamber choice (prefer the cleaner bidirectional chamber `12c9360a`), exact reconcile SQL ordering
  (follow 146/151 idempotent patterns), per-member stance chairs, dedupe mechanics, and which existing headshots
  pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 152: West Covina deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — WCOV-01 acceptance text

### Proven precedents to copy
- `.planning/phases/151-el-monte-deep-seed/` — most recent deep-seed; **same dual-chamber-merge defect** +
  reconcile/headshot/stance mechanics + migration-numbering pre-flight + EV-Accounts commit step.
- `.planning/phases/146-palmdale-deep-seed/` — the **by-district relabel pattern** (relabel existing At-Large
  rows to occupant districts + create missing seats; rotational mayor = title on a seat) — the likely model if
  West Covina is now by-district.
- `.planning/phases/148-torrance-deep-seed/` — the **"stay At-Large" (no relabel)** precedent if West Covina is
  still at-large.
- `.planning/phases/150-downey-deep-seed/` — the **mayor-verification lesson** (research had Downey's rotational
  mayor wrong; the official city site is authoritative) + rotational-mayor handling.
- `C:/EV-Accounts/backend/migrations/1000_el_monte_reconcile.sql` + `1001_el_monte_complete.sql` — most recent
  idempotent dual-chamber-merge reconcile + roster SQL templates (verify exact filenames at plan time).
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA',
  districts label column is `label` not `name`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase151_elmonte_complete` — immediately-prior deep-seed; dual-chamber merge + ledger/commit conventions
- `project_by_district_relabel_pattern` — proven by-district relabel mechanics (if West Covina is by-district)
- `project_phase150_downey_complete` — verify mayor/form-of-government on the official city site; ledger/commit
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed true again for West Covina)
- `feedback_no_git_in_ev_accounts` — EV-Accounts IS a git repo (master); commit migration files via `git -C`
- `feedback_section_split_check` — run after reconcile (West Covina is NOT in the split-section-defect set; expect 0 rows)
- `feedback_stance_*`, `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — stance + headshot discipline
- `feedback_provide_city_browse_links` — give a live browse link at completion/checkpoints

### Live browse link (for checkpoints / completion)
- `https://essentials.empowered.vote/results?browse_geo_id=0684200&browse_mtfcc=G4110`
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-21)

Gov: `City of West Covina, California, US` = `1982a9fa-dc56-482d-83fc-27bf69458b22`; geo_id NULL → `0684200`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `west-covina-city-council`):
- `12c9360a-60ac-476f-b2ac-055a26e891a0` (official_count 5) — 3 offices, **bidirectional links clean**:
  - Letty **Lopez-Viado** (687361, office `4a8f2fd6`, pol `2872d7a4`, At-Large LOCAL, 1 img, 0 stances)
  - Ollie **Cantos** (687365, office `50471af9`, pol `ecc57cd4`, At-Large LOCAL, 1 img, 0 stances)
  - Tony **Wu** (687367, office `65bf4e71`, pol `1bb5c062`, At-Large LOCAL, 1 img, 0 stances)
- `b1a2c4cb-25b6-46c8-a3ab-852024e00f45` (official_count NULL) — 2 offices, **one-directional links**
  (`offices.politician_id` set, `politicians.office_id` NULL — repair on merge):
  - Rosario **Diaz** (-201107, office `abd27abb`, pol `f5bf4ec4`, At-Large LOCAL, 1 img, 0 stances)
  - Brian **Gutierrez** (-201108, office `0f3cce5f`, pol `22fc2cdc`, At-Large LOCAL, 1 img, 0 stances)

Total = 5 council offices / 5 distinct politicians. All `district_type='LOCAL'`, label 'At-Large'. **No Mayor /
LOCAL_EXEC office** — West Covina's mayor is believed rotational (a title on one council seat). Form of government
(at-large vs by-district) is the central research question (CVRA history → may be by-district now).

Headshot status: **all 5 have 1 image** (pre-existing, dimensions UNVERIFIED) → Wave 3 is verify-and-fix, not
greenfield. Stance status: **all 5 = 0 stances** → Wave 4 is full greenfield.

Out-of-scope same-name gov: `131e33d0-e40a-4aaf-bc8d-c665750d1b6d` "West Covina Unified" = West Covina Unified
School District.

Migration counter: on-disk file MAX = 1009 (El Monte); live `schema_migrations` MAX = 999. **Next migration =
1010** (on-disk counter authoritative). New-politician ext_id scheme `-7010xx` (El Monte's Cortez used -701001;
query MIN(external_id) at plan time to avoid collision).
</code_context>

<specifics>
## Specific Ideas

- Operator chose to skip discuss-phase and proceed straight to planning (pattern locked by 142–151); orchestrator
  performed the mandatory live DB pre-check that the researcher subagent cannot do.
- Form-of-government and current-mayor calls are deferred to research **with NO guessed default** and a hard
  requirement to verify against the official West Covina city site (westcovina.org) — the explicit carry-forward
  from the Downey mayor-identity miss.
- Survivor chamber should be the cleaner bidirectional `12c9360a` (operator discretion, confirm at plan time).
</specifics>

<deferred>
## Deferred Ideas

- West Covina Unified School District (gov `131e33d0`) — separate government, out of scope.
- Run West Covina's own split-section check post-reconcile (expect 0 rows; West Covina is NOT in the
  `project_split_section_defects_5_cities` set).
- Phase 157 (Wave-2 close-out) consumes West Covina's final per-city counts.

None beyond the above.
</deferred>

---

*Phase: 152-west-covina-deep-seed*
*Context gathered: 2026-06-21 via live DB pre-check (discuss-phase skipped)*
