# Phase 155: Norwalk deep-seed - Context

**Gathered:** 2026-06-22
**Status:** Ready for planning
**Requirements:** NRWK-01
**Source:** /gsd-discuss-phase (live DB pre-check by orchestrator + operator-approved approach — all 4 gray areas locked with recommended defaults)

<domain>
## Phase Boundary

Take **City of Norwalk** (geo_id `0652526`, gov `15897159-e6bf-4d7e-9b45-44d62c4ebb8a`) from a partial/defective
dual-chamber seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same deep-seed pattern as phases 142–154.

**⚠ Dual-chamber reconcile (DB-confirmed 2026-06-22), Burbank-class:** the City of Norwalk gov already exists with
`geo_id` NULL and **two duplicate 'City Council' chambers** (both slug `norwalk-city-council`), holding **5 offices /
5 distinct people** total. NO duplicate-person dedup (all 5 names distinct). One chamber is one-directional
(`politicians.office_id` NULL), the other bidirectional-clean — repair the back-pointers during the merge.

**Key difference from Burbank:** Norwalk **already has a separate LOCAL_EXEC Mayor office** (district "Norwalk Mayor",
occupant Tony Ayala) — unlike Burbank, which had no Mayor office. So the form-of-government question is live and
genuinely uncertain: directly-elected Mayor (keep LOCAL_EXEC) vs rotational-mayor-as-title (convert to council seat).
MUST be research-verified — no guessed default.

All 5 occupants have 1 image / **0 stances** → Wave 4 is full greenfield.

**In scope:** City of Norwalk only. **NOT in scope:** `Norwalk-La Mirada Unified, California, US`
(`d4f9a7fa-8f22-40cd-90d8-639f9a6c2c8c`) — separate school-district government.
</domain>

<decisions>
## Implementation Decisions

### Structure — dual-chamber merge + geo_id backfill (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0652526'` on gov `15897159`
  (guard `geo_id IS NULL OR geo_id=''`; state already CA), then merge the two duplicate 'City Council' chambers into
  ONE via move-then-delete (UUID-targeted — both share name 'City Council' / slug `norwalk-city-council`; assert
  doomed chamber empty before delete):
  - **SURVIVOR = `97397b0f-61f1-4251-bf29-3fd5f99c0108`** (official_count NULL, **4 offices** — holds the bulk of the
    roster incl. the Mayor structure). Chosen as survivor to minimize office moves (move 1 vs 4). Its At-Large
    district = `5677c0ab-e038-45d9-a744-141b28329036` (CA, LOCAL, 3 offices) = the surviving At-Large district. Its
    4 offices are **one-directional** (`offices.politician_id` set, `politicians.office_id` NULL) → **repair all 4
    back-pointers** (set `politicians.office_id` to match) as part of the reconcile (the Lancaster bidirectional-link
    trap, [[project_v170_wave2_not_greenfield]]).
  - **DOOMED = `e7e787f7-4695-4747-9dd7-b111472ca9ae`** (official_count 5, 1 office, bidirectional-clean). Its
    At-Large district = `f9e8037d-e311-4583-9623-3201259ba7e4` (CA, LOCAL, 1 office). Move its single office
    (Jennifer Perez) into the survivor chamber, **re-point it to the survivor At-Large district `5677c0ab`**, then
    delete the empty doomed chamber + the now-orphaned doomed At-Large district `f9e8037d`. End-state = ONE chamber,
    ONE At-Large district holding all current at-large seats (+ the Mayor LOCAL_EXEC district pending D-02).
  - **Title normalization:** survivor uses `'Council Member'` (with space), doomed uses `'Councilmember'` —
    normalize all council titles to **`'Councilmember'`** (Santa Clarita 143 precedent).
  - Set survivor `official_count` per D-02 outcome (5 if council-only count; mayor excluded if a separately-counted
    directly-elected Mayor — El Monte convention).
  - Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, both chamber UUIDs, the 5 offices + members/ext_ids, both
    link directions, all three district UUIDs, and live `schema_migrations` MAX + on-disk MAX.

### Form of government (Wave 1/2 — DEFER TO RESEARCH, NO guessed default)
- **D-02 (research-verify mayor type + at-large/by-district — no guessed default):** DB currently models Norwalk as
  a **directly-elected LOCAL_EXEC Mayor** (Tony Ayala, district "Norwalk Mayor" `4126e079`) **+ 4 At-Large council**.
  **MANDATORY (the Downey/El Monte lesson, [[project_phase150_downey_complete]], [[project_by_district_relabel_pattern]]):
  research MUST verify the form of government against the OFFICIAL city site (norwalkca.gov) before committing** —
  (a) at-large vs by-district (Norwalk may have switched to districts under CVRA — if so, relabel At-Large → District
  N by verified per-person map and split the shared district_id), and (b) directly-elected Mayor vs rotational mayor.
  **Working hypothesis to confirm/refute (NOT a default): Norwalk is a general-law CA city, and general-law cities
  almost always have a ROTATIONAL mayor selected annually by/from the council** — which would make the existing
  separate LOCAL_EXEC Mayor office a mis-seed.
  - **If research finds rotational mayor (hypothesis confirmed):** Norwalk has **5 at-large council seats**, one of
    whom holds the rotational Mayor title. Convert Ayala's separate Mayor LOCAL_EXEC office into a council seat on
    the survivor chamber/At-Large district and set the current rotational Mayor as a **title on that person's council
    seat** (Downey 150 / West Covina 152 precedent — do NOT keep a separate LOCAL_EXEC Mayor office). Drop the orphan
    "Norwalk Mayor" LOCAL_EXEC district. `official_count=5`.
  - **If research finds a genuinely directly-elected Mayor:** keep the Mayor as a LOCAL_EXEC office (El Monte/
    Inglewood/Lancaster model), council seats counted separately (Mayor excluded — El Monte convention).
  - **If research finds by-district:** relabel + split per the West Covina/Inglewood pattern.

### Roster — verify currency against official site (Wave 2 — registers in schema_migrations)
- **D-03 (research-verify all 5; unlink-not-delete departed; new members -7010xx; official_count per D-02):** The 5
  current DB occupants — Tony **Ayala** (-200876, Mayor), Rick **Ramirez** (-201327), Margarita L. **Rios** (-201328),
  Ana **Valencia** (-201329) [all four one-directional, negative ext_id], Jennifer **Perez** (666845)
  [bidirectional, positive ext_id] — are **SUSPECT until verified against norwalkca.gov** (bulk-seeded; Norwalk had a
  **Nov-2024 election** — turnover possible). Research MUST confirm the current council. For any seeded person who is
  NOT a current member (departed/defeated): **unlink-not-delete** (null the office↔politician link both directions,
  KEEP the politician + any stance/photo rows — Whittier/SM/Downey/El Monte/Inglewood precedent). Any genuinely-new
  current member created fresh gets a new negative ext_id (`-7010xx` scheme; query `MIN(external_id)` to avoid
  collision). The 40+ `'... FOR NORWALK CITY COUNCIL ...'` rows (ext_id NULL, is_active=false) are **campaign-finance
  committees, NOT politicians — ignore them** (Lancaster lesson). Set survivor chamber `official_count` per D-02.

### Headshots (Wave 3 — verify-and-fix + fill gaps, audit-only migration)
- **D-04 (verify-and-fix the 5 existing + fill any gaps honestly):** Image state — all 5 current occupants have
  exactly 1 image (Ayala, Ramirez, Rios, Valencia, Perez). For each CURRENT official (after the D-03 roster verify):
  verify correct person, no superimposed text/graphics ([[feedback_headshot_no_graphics]]), **600×750** 4:5
  ([[feedback_headshot_image_sizing]]). Re-crop/replace any existing image that fails. Fill gaps for any newly-seeded
  member from norwalkca.gov (**WAF status UNKNOWN — check**; many LA-area .gov sites are WAF-403 e.g. Downey/Glendale/
  Pomona; others NO-WAF CivicEngage). Operator in-browser fallback if WAF-403; alternate hosts (Ballotpedia/SCAG/
  Wikimedia/campaign) otherwise. Crop 4:5 FIRST → 600×750 Lanczos q90 ([[feedback_headshot_resize_no_distort]]),
  upload `politician_photos/{uuid}-headshot.jpg` (x-upsert), `type='default'`, real `photo_license` +
  `photo_origin_url`. Honest gap if no acceptable portrait. Blocking human-verify checkpoint. **⚠ Wrong-person guard
  (the West Covina lesson): verify each image is the actual Norwalk official, not a name-collision.**

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–154):** evidence-only **CHAIRS** model (value = the chair the evidence matches,
  never a polarity axis — [[feedback_compass_chairs_not_polarity]]); 100% citation (paired `inform.politician_answers`
  + `inform.politician_context` with reasoning + real source URLs); **no defaulted/neutral values**
  ([[feedback_stance_no_default_value]]); honest blank spokes; research ALL non-judicial compass topics
  ([[feedback_stance_research_all_topics]]); **NO judicial-* topics** (Norwalk is council-manager with an appointed
  City Attorney); live non-judicial topics queried at apply time (never hardcode retired IDs —
  [[project_compass_live_topic_ids]]); **ONE research agent at a time** ([[feedback_stance_research_one_at_a_time]]);
  rent-regulation only-if-real-evidence (no manufactured RSO). All 5 rows currently 0 stances → full greenfield for
  the current officials. Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot + stance
  migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration = 1034** (Burbank ended on-disk 1033; live integer `schema_migrations` MAX was 999 at Burbank time
  — recent structural migs applied live via MCP with timestamp versions, but the on-disk/committed counter leads;
  pre-flight MUST re-confirm BOTH).
- **COMMIT the migration files to the EV-Accounts repo** ([[feedback_no_git_in_ev_accounts]]) via
  `git -C "C:/EV-Accounts"` per the per-phase convention. DB applied live via Supabase MCP; FILES still committed.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government (the
  dual-chamber merge + link repair + Ayala mayor-type resolution + roster verification) is the hard requirement;
  headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact reconcile SQL ordering (follow 151/152/153/154 idempotent patterns), survivor-chamber move-then-delete
  mechanics, At-Large district consolidation mechanics, Mayor-office conversion mechanics (if D-02 finds rotational),
  per-member stance chairs, and which existing headshots pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 155: Norwalk deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — NRWK-01 acceptance text

### Proven precedents to copy
- `.planning/phases/154-burbank-deep-seed/` — immediately-prior deep-seed; **same dual-chamber-merge +
  one-directional link repair + geo_id backfill + At-Large consolidation** (Norwalk differs: HAS a Mayor office, so
  form-of-government must be resolved).
- `.planning/phases/150-downey-deep-seed/` — **rotational mayor = title on a council seat** (Norwalk's model if
  research confirms rotational); verify mayor on official city site (Downey research was initially wrong).
- `.planning/phases/152-west-covina-deep-seed/` — dual-chamber merge + rotational-mayor handling + wrong-person
  headshot lesson.
- `.planning/phases/145-lancaster-deep-seed/` — directly-elected Mayor (LOCAL_EXEC) model + bidirectional-link-trap
  repair + ignore campaign-finance-committee rows (relevant if research finds directly-elected Mayor).
- `C:/EV-Accounts/backend/migrations/1026_burbank_reconcile.sql` + `1027_burbank_complete.sql` — most recent
  idempotent dual-chamber-merge + one-directional link-repair + roster templates.
- `C:/EV-Accounts/backend/migrations/1028_burbank_headshots.sql` — most recent headshot audit-only template.
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA', districts
  label column is `label`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase154_burbank_complete` — immediately-prior deep-seed; dual-chamber merge + one-directional repair + geo_id backfill + inform compass schema notes
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed again for Norwalk: gov + 2 chambers pre-existed); bidirectional-link trap; ignore committee rows
- `project_phase150_downey_complete` — rotational mayor = title on seat; verify mayor on official site
- `project_by_district_relabel_pattern` — by-district relabel mechanics (only if research finds Norwalk is by-district)
- `feedback_no_git_in_ev_accounts`, `feedback_section_split_check`, `feedback_stance_*`,
  `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — discipline

### Live browse link (checkpoints / completion)
- `https://essentials.empowered.vote/results?browse_geo_id=0652526&browse_mtfcc=G4110`
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-22)

Gov: `City of Norwalk, California, US` = `15897159-e6bf-4d7e-9b45-44d62c4ebb8a`; geo_id NULL → `0652526`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `norwalk-city-council`):
- `97397b0f-61f1-4251-bf29-3fd5f99c0108` (official_count **NULL**) — 4 offices, **one-directional** (pol.office_id
  NULL) = **SURVIVOR** (holds the bulk + Mayor structure). At-Large district `5677c0ab-e038-45d9-a744-141b28329036`
  (CA, LOCAL, 3 offices) = surviving At-Large district; Mayor LOCAL_EXEC district `4126e079-d0ff-494e-8371-d6ef2e98da3f`
  ("Norwalk Mayor", 1 office):
  - Tony **Ayala** (-200876, pol `5e8bcf17-3a4d-4614-a71c-c4ea8396f7cb`, office `5edc1993`, **Mayor** LOCAL_EXEC, 1 img, 0 stances) — repair link; mayor-type pending D-02
  - Rick **Ramirez** (-201327, pol `e3b9af1b-3704-4bc5-a6ef-ab1f814bd29d`, office `119e0ffd`, Council Member At-Large, 1 img, 0 stances) — repair link
  - Margarita L. **Rios** (-201328, pol `bd64253b-0bd1-4b9f-85b1-76180c760d07`, office `87df841f`, Council Member At-Large, 1 img, 0 stances) — repair link
  - Ana **Valencia** (-201329, pol `ba647863-25fb-4ccf-9cb0-5a1c912d1b27`, office `4d8a62f7`, Council Member At-Large, 1 img, 0 stances) — repair link
- `e7e787f7-4695-4747-9dd7-b111472ca9ae` (official_count **5**) — 1 office, **bidirectional-clean** = DOOMED.
  At-Large district `f9e8037d-e311-4583-9623-3201259ba7e4` (CA, LOCAL, 1 office) = doomed district (drop after move):
  - Jennifer **Perez** (666845, pol `3ed36508-9ae9-41af-aaba-e5e39bb87aa7`, office `8e25ebb7`, **Councilmember** At-Large, 1 img, 0 stances) — bidirectional-clean; move to survivor + re-point district

Total = 5 offices / 5 distinct people (no person-dedup needed). Title drift: survivor 'Council Member' vs doomed
'Councilmember' → normalize to 'Councilmember'. All 5 = 0 stances → Wave 4 full greenfield. Images: 5/5 have 1 each.

Office-unlinked rows under this gov are all campaign-finance committees (ext_id NULL, is_active=false) — NOT
politicians, ignore (Lancaster rule). No genuine office-unlinked politician rows to reseat.

Out-of-scope same-name gov: `d4f9a7fa-8f22-40cd-90d8-639f9a6c2c8c` = Norwalk-La Mirada Unified School District.

Migration counter: on-disk MAX = 1033 (Burbank); live integer `schema_migrations` lags (timestamp-versioned recents).
**Next migration = 1034** (on-disk authoritative; pre-flight re-confirm both).
</code_context>

<specifics>
## Specific Ideas

- Operator approved the full reconcile approach 2026-06-22 (selected all 4 gray areas + "all locked", i.e. accept the
  recommended defaults): dual-chamber merge into the 4-office survivor `97397b0f` with one-directional link repair for
  Ayala + Ramirez + Rios + Valencia, geo_id backfill, At-Large district consolidation (`5677c0ab` survives, drop
  `f9e8037d`), title normalization to 'Councilmember'; research-verify form of government (mayor type + at-large/by-
  district) against norwalkca.gov with NO guessed default (hypothesis = general-law rotational mayor → convert Ayala's
  Mayor LOCAL_EXEC office to a 5th council seat with mayor-as-title); research-verify the 5-member roster (Nov-2024
  turnover possible; unlink-not-delete departed); headshot verify-and-fix the 5 existing + fill any gap; evidence-only
  stances full greenfield for the current officials.
- Wrong-person headshot guard carried forward from West Covina: verify each portrait is the actual Norwalk official,
  not a name-collision.
- Norwalk's existing separate LOCAL_EXEC Mayor office (Tony Ayala) is the salient anomaly vs Burbank — resolve it via
  research, do NOT assume it is correct and do NOT assume it is wrong.
</specifics>

<deferred>
## Deferred Ideas

- Norwalk-La Mirada Unified School District (gov `d4f9a7fa`) — separate government, out of scope.
- Run Norwalk's own split-section check post-reconcile (expect 0 rows once consolidated to one At-Large district;
  Norwalk is NOT in the `project_split_section_defects_5_cities` set).
- The browse school-district-sliver display issue ([[project_browse_school_district_slivers]]) is a separate
  browse-logic follow-up, not part of this phase.
- Phase 156 (Bellflower deep-seed) and Phase 157 (Wave-2 LAC2-RETRO close-out) consume Norwalk's final per-city counts.

None beyond the above — discussion stayed within phase scope.

</deferred>

---

*Phase: 155-norwalk-deep-seed*
*Context gathered: 2026-06-22 via /gsd-discuss-phase + live DB pre-check*
