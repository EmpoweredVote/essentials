# Phase 151: El Monte deep-seed - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning
**Requirements:** ELMN-01

<domain>
## Phase Boundary

Take **City of El Monte** (geo_id `0622230`, gov `f5fe3651-75c2-4ede-86e2-c13fc008d545`) from a partial/
defective seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same 4-wave deep-seed pattern as phases 142–150.

**⚠ This is a RECONCILE, not greenfield (DB-confirmed 2026-06-21):** the El Monte city gov already exists with
`geo_id` NULL and **two duplicate 'City Council' chambers** (both slug `el-monte-city-council`), holding 6
offices total (5 council + a directly-elected Mayor).

**In scope:** City of El Monte only. **NOT in scope:** `El Monte City` / "Board of Trustees" gov
`e46a6c1e-15ab-4c75-bdc9-4d25a3f20d76` (that is the **El Monte City School District** — confusingly named,
separate government); `City of South El Monte` (`71d17594`); `El Monte Union High` (`0f1a5895`).
</domain>

<decisions>
## Implementation Decisions

### Structure (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0622230'` on gov `f5fe3651`
  (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers
  (`5ca38f3a` official_count NULL / 4 offices + `b41e0065` official_count 7 / 2 offices) into ONE via
  move-then-delete (UUID-targeted — both share name 'City Council' / slug `el-monte-city-council`; assert the
  doomed chamber is empty before delete). A Wave-1 STOP-on-drift pre-flight re-confirms gov UUID, both chamber
  UUIDs, the 6 offices + members/ext_ids, both link directions, and the live schema_migrations MAX + on-disk
  MAX before numbering.

### Form of government (Wave 1 — DEFAULT = stay At-Large + keep directly-elected Mayor)
- **D-02 (form of government — DEFERRED TO RESEARCH, with default):** The DB shows **At-Large council +
  Jessica Ancona as a directly-elected `LOCAL_EXEC` Mayor** ('El Monte Mayor' district). El Monte is believed
  to be the **Torrance (148) "stay At-Large" + Lancaster (145) "keep LOCAL_EXEC directly-elected Mayor"** model
  — NOT the Downey/Palmdale by-district + rotational model. **DEFAULT: keep At-Large labels and keep Ancona's
  LOCAL_EXEC Mayor district as-is** (do NOT relabel to District 1–N, do NOT collapse the Mayor to a rotational
  title). **MANDATORY (the Phase-150 Downey lesson — see [[project_phase150_downey_complete]]): research MUST
  verify El Monte's form of government AND the current mayor's identity against the OFFICIAL city site
  (elmonteca.gov) before committing.** Only relabel to districts / change the mayor model if the official site
  positively contradicts the default.

### Roster (Wave 2 — verify count + currency, registers in schema_migrations)
- **D-03 (current-seated, retire departed):** 6 offices are seeded — **5 council** (Sheila Crippen-Thomas
  -201202, Cindy Galvan -201203, Martin Herrera -201204, Viviana Longoria 657386, Julia Ruedas 657390) **+
  Mayor Jessica Ancona** (-200669). El Monte's real council is likely **Mayor + 4 at-large members (5-seat
  body)**, so the 5 council rows may be ONE too many — **treat the roster as SUSPECT** until verified against
  elmonteca.gov. Confirm the real seat count + who holds each seat today; **unlink-not-delete** any departed
  member (null the office↔politician link, keep politician + stance + photo rows — Whittier/Santa Monica/
  Downey precedent). Set `official_count` to the verified council size (one chamber currently has NULL, the
  other 7 — both wrong/stale).

### Headshots (Wave 3 — verify existing, audit-only migration)
- **D-04 (verify-first; all 6 already have an image):** Unlike prior cities, **all 6 officials already have 1
  `politician_images` row** (pre-existing, dimensions unverified). For each CURRENT official: verify the image
  is the correct person, has no superimposed text/graphics, and is **600×750** (4:5). Keep good ones as-is;
  **re-crop/re-source only those that fail** (wrong person, wrong dimensions, or low quality). Try direct curl
  from elmonteca.gov first (WAF status UNKNOWN — check); operator in-browser fallback if WAF-403; alternate
  hosts (Ballotpedia/SCAG/Wikimedia/campaign) otherwise. Crop 4:5 FIRST → 600×750 Lanczos q90, upload to
  `politician_photos/{uuid}-headshot.jpg` (x-upsert), `type='default'`, real `photo_license` + `photo_origin_url`.
  Honest gap if no acceptable portrait. Blocking human-verify checkpoint.

### Stances (Wave 4 — audit-only migrations, greenfield)
- **Carried forward (locked by 142–150, not re-discussed):** evidence-only **CHAIRS** model (value = the chair
  the evidence matches, never a polarity axis); 100% citation (paired `inform.politician_answers` +
  `inform.politician_context` with reasoning + real source URLs); **no defaulted/neutral values**; honest blank
  spokes; **NO judicial-* topics** (El Monte is council-manager); live non-judicial topics queried at apply
  time (never hardcode retired IDs); ONE research agent at a time. All 6 officials currently have 0 stances →
  full greenfield. Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration ≈ 1000** (Downey ended at on-disk 999, schema_migrations MAX 999; pre-flight MUST re-confirm
  live schema_migrations MAX + on-disk MAX — beware other workstreams advancing the counter, e.g. the
  state_exec batches that jumped ahead during Downey).
- **COMMIT the migration files to the EV-Accounts repo as part of this phase** (see
  [[feedback_no_git_in_ev_accounts]]) — `git -C "C:/EV-Accounts" add backend/migrations/<files>` + commit per
  the per-phase convention. The Phase 143–150 backlog (uncommitted migrations) was just backfilled; do NOT let
  it recur. DB is applied live via Supabase MCP; the FILES still need committing.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + correct roster/form-of-government is the
  hard requirement; headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Survivor-chamber choice, exact reconcile SQL ordering (follow 147/149/150 idempotent patterns), per-member
  stance chairs, dedupe mechanics, and which existing headshots pass vs need re-crop.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 151: El Monte deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — ELMN-01 acceptance text

### Proven precedents to copy
- `.planning/phases/150-downey-deep-seed/` — most recent deep-seed; reconcile/headshot/stance mechanics + the
  **mayor-verification lesson** (research had Downey's mayor wrong; the official city site is authoritative).
  Also the migration-numbering pre-flight and the EV-Accounts commit step.
- `.planning/phases/148-torrance-deep-seed/` — the **"stay At-Large" (no by-district relabel)** precedent — the
  likely model for El Monte's council.
- `.planning/phases/145-lancaster-deep-seed/` — **directly-elected LOCAL_EXEC Mayor kept as-is** precedent.
- `C:/EV-Accounts/backend/migrations/990_downey_reconcile.sql` + `991_downey_complete.sql` — most recent
  idempotent reconcile + roster SQL templates.
- `C:/EV-Accounts/backend/migrations/946_pasadena_reconcile.sql` / `947_pasadena_complete.sql` — dual-chamber
  merge templates.
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA',
  districts label column is `label` not `name`), §Step 4 Headshots (4:5 crop first → 600×750).

### Project memory (load relevant)
- `project_phase150_downey_complete` — verify mayor/form-of-government on the official city site; ledger/commit conventions
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed true again for El Monte)
- `feedback_no_git_in_ev_accounts` — EV-Accounts IS a git repo (master); commit migration files there via `git -C`
- `feedback_section_split_check` — run after reconcile (expect 0 rows for El Monte proper)
- `feedback_stance_*`, `feedback_compass_chairs_not_polarity`, `feedback_headshot_*` — stance + headshot discipline
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-21)

Gov: `City of El Monte, California, US` = `f5fe3651-75c2-4ede-86e2-c13fc008d545`; geo_id NULL → `0622230`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `el-monte-city-council`):
- `5ca38f3a-ea2e-4160-abb5-f897702b6cb6` (official_count NULL) — 4 offices:
  - Sheila **Crippen-Thomas** (-201202, office `211af77a`, At-Large LOCAL, 1 img)
  - Cindy **Galvan** (-201203, office `3ffcb893`, At-Large LOCAL, 1 img)
  - Martin **Herrera** (-201204, office `7e9eac5e`, At-Large LOCAL, 1 img)
  - Jessica **Ancona** (-200669, office `57d646fc`, **Mayor, LOCAL_EXEC**, district 'El Monte Mayor', 1 img)
- `b41e0065-40ed-4486-8ff1-6fe73e0c2532` (official_count 7) — 2 offices:
  - Viviana **Longoria** (657386, office `3040818a`, At-Large LOCAL, 1 img)
  - Julia **Ruedas** (657390, office `06d458fe`, At-Large LOCAL, 1 img)

Total = 6 offices (5 council + 1 directly-elected Mayor). All council rows `district_type='LOCAL'` label
'At-Large' (likely correct — stay At-Large unless research says otherwise). Mayor row already LOCAL_EXEC
(likely correct — El Monte directly elects its mayor).

**Roster currency: SUSPECT** — 5 council rows + Mayor = 6, but El Monte's body is likely Mayor + 4 (5 seats);
verify count + current holders against elmonteca.gov; some seeded names may be stale.

Headshot status: **all 6 have 1 image** (pre-existing, dimensions UNVERIFIED) → Wave 3 is verify-and-fix, not
greenfield. Stance status: **all 6 = 0 stances** → Wave 4 is full greenfield.

Out-of-scope same-name govs: `e46a6c1e` "El Monte City"/Board of Trustees = El Monte City School District;
`71d17594` South El Monte; `0f1a5895` El Monte Union High.
</code_context>

<specifics>
## Specific Ideas

- User accepted the locked 142–150 precedent for structure, roster (unlink-not-delete), headshots, and stances.
- Form-of-government final call deferred to research **with a default** (stay At-Large + keep directly-elected
  LOCAL_EXEC Mayor) and a hard requirement to verify mayor + form against the official El Monte city site —
  the explicit carry-forward from the Downey mayor-identity miss.
</specifics>

<deferred>
## Deferred Ideas

- El Monte City School District (gov `e46a6c1e`), South El Monte (`71d17594`), El Monte Union High (`0f1a5895`)
  — separate governments, out of scope.
- Run El Monte's own split-section check post-reconcile (expect 0 rows; El Monte proper is NOT in the
  `project_split_section_defects_5_cities` set — South El Monte is).
- Phase 157 (Wave-2 close-out) consumes El Monte's final per-city counts.

None beyond the above — discussion stayed within phase scope.
</deferred>

---

*Phase: 151-el-monte-deep-seed*
*Context gathered: 2026-06-21*
