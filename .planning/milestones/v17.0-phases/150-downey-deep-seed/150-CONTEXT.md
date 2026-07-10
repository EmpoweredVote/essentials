# Phase 150: Downey deep-seed - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Requirements:** DWNY-01

<domain>
## Phase Boundary

Take **City of Downey** (geo_id `0619766`, gov `1a31cf01-5e05-46d9-88f3-6b94aaa0c607`) from a partial/
defective seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same 4-wave deep-seed pattern as phases 142–149.

**⚠ This is a RECONCILE, not greenfield (DB-confirmed 2026-06-20):** the Downey gov already exists with
`geo_id` NULL, **two duplicate 'City Council' chambers**, and **6 offices for 5 real seats** — all mislabeled
"At-Large." Downey is a general-law CVRA city: **5 single-member districts with a *rotational* mayor** (chosen
annually by the council), **not** a directly-elected mayor like Pasadena.

**In scope:** City of Downey only. **NOT in scope:** Downey Unified school district (separate gov
`32e2fad0-dfde-406a-a0ce-93e0a58f40ac`).
</domain>

<decisions>
## Implementation Decisions

### Structure (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0619766'` on gov `1a31cf01`
  (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers
  (`7cb8a90c` official_count 5 + `a30fd533` official_count NULL) into ONE chamber via move-then-delete
  (target by UUID — both share the name 'City Council' / slug `downey-city-council`), asserting the doomed
  chamber is empty before delete. A Wave-1 STOP-on-drift pre-flight re-confirms both chamber UUIDs, the 6
  offices, the roster, and the duplicate/defect set before any write.

### Form of government (Wave 1 — BY-DISTRICT conversion)
- **D-02 (relabel At-Large → District 1–5, rotational mayor):** Downey is **5 single-member districts**. Use
  the proven **Pomona (147) / Palmdale (146) by-district relabel pattern**: relabel the wrongly-'At-Large'
  council rows to `District 1`…`District 5` (LOCAL) and map each seated member to their **real district**
  (research-confirmed against the official Downey site). Create any missing district rows; do NOT tear down
  and rebuild.
- **D-02a (rotational-mayor handling — DEFERRED TO RESEARCH per user):** The DB has a stray `LOCAL_EXEC` row
  (**Hector Sosa**, office `cc3bacd0`). The researcher MUST verify Downey's form of government against
  downeyca.org. **Default decision: apply the Palmdale rotational-mayor pattern** — rotational mayor is a
  *title on the district seat its holder occupies*; collapse the `LOCAL_EXEC` row into a normal District seat;
  **NO separate Mayor office/district.** Only keep a `LOCAL_EXEC` Mayor row if research positively confirms
  Downey *directly elects* its mayor (contradicts its known CVRA rotational structure — very unlikely).

### Roster (Wave 2 — current-seated, reconcile 6 → 5)
- **D-03 (current-seated, retire departed):** **6 people are seeded for 5 seats** — at least one is stale.
  Verify the roster against the official Downey site and seat whoever holds each district seat **today**.
  Prime stale suspect: **Mario Trujillo** (-201200), who sits alone in the orphan chamber `a30fd533`. For any
  departed member: **unlink** the office (null the office↔politician link / reassign to the current member)
  but **keep** their politician + stance + photo rows (the Whittier/Santa Monica/Pasadena unlink-not-delete
  precedent). Seat any new current members. Final: one chamber, 5 districted council seats, consistent
  bidirectional links, `official_count=5` per existing convention.

### Headshots (Wave 3 — audit-only migration)
- **D-04 (direct-first, operator fallback):** Try direct curl from downeyca.org official portraits first.
  If WAF-403, fall back to operator-supplied in-browser downloads + alternate hosts (Ballotpedia, SCAG,
  Wikimedia, campaign sites). Every portrait: identity-verified, no superimposed text, crop 4:5 FIRST →
  600×750 Lanczos q90, uploaded to `politician_photos/{uuid}-headshot.jpg` (x-upsert), `type='default'`,
  `photo_license` matching the real source, `photo_origin_url` set. Honest gap if no acceptable verified
  portrait. Blocking human-verify checkpoint. (All 6 seeded officials currently have **0 images** → full
  greenfield.)

### Stances (Wave 4 — audit-only migrations)
- **Carried forward (locked by 142–149, not re-discussed):** evidence-only **CHAIRS** model (value = the
  chair the evidence matches, never a polarity axis); 100% citation (paired `inform.politician_answers` +
  `inform.politician_context` with reasoning + real source URLs); **no defaulted/neutral values**; honest
  blank spokes where no record exists; **NO judicial-* topics** (Downey is council-manager with appointed
  City Attorney); live non-judicial topics queried at apply time (never hardcoded retired IDs); ONE research
  agent at a time. Blocking human-verify checkpoint. (All 6 officials currently have **0 stances** → full
  greenfield.)

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration number ≈ 985** — Pasadena ended at 956 (audit-only); migrations **980–984** are now taken
  by `state_exec_seed` batches; **957–979 is an unused gap**; registered `schema_migrations` MAX = 947.
  Pre-flight MUST re-confirm the live `schema_migrations` MAX **and** the on-disk MAX before numbering.

### Verdict bar (carried forward)
- Structure-hard / data-soft: correct government + single chamber + districted 5-seat roster is the hard
  requirement; headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact district→member mapping (research-determined), the rotational-mayor / `LOCAL_EXEC`-row resolution
  (research-confirmed, Palmdale default), per-member stance chairs, dedupe mechanics, and the precise reconcile
  SQL ordering (follow the 146/147/149 idempotent patterns).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 150: Downey deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — DWNY-01 acceptance text

### Proven precedents to copy (by-district reconcile + deep-seed)
- `.planning/phases/149-pasadena-deep-seed/` — most recent and CLOSEST analog (same dual-chamber merge +
  geo_id backfill + At-Large→District relabel reconcile); copy its PLANs/SUMMARYs/VERIFICATION mechanics.
  **Key difference: Pasadena had a directly-elected mayor; Downey has a rotational mayor → use Palmdale's
  rotational handling, NOT Pasadena's LOCAL_EXEC Mayor district.**
- `.planning/phases/146-palmdale-deep-seed/146-CONTEXT.md` + plans — by-district relabel pattern with
  **rotational mayor = title on seat** (the governing precedent for D-02a)
- `.planning/phases/147-pomona-deep-seed/` — direct by-district reconcile precedent (geo_id backfill +
  chamber merge + At-Large→District relabel + shared-district split)
- `C:/EV-Accounts/backend/migrations/946_pasadena_reconcile.sql` + `947_pasadena_complete.sql` — idempotent
  reconcile + roster SQL templates (most recent)
- `C:/EV-Accounts/backend/migrations/926_pomona_reconcile.sql` — earlier idempotent reconcile template
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA',
  district_type on districts; districts label column is `label`, not `name`), §Step 4 Headshots (4:5 crop
  first → 600×750)

### Project memory (load relevant)
- `project_by_district_relabel_pattern` — Palmdale/Pomona relabel-existing-rows approach + rotational-mayor-
  as-title rule (GOVERNS D-02/D-02a)
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed true again for Downey)
- `feedback_section_split_check` — run after reconcile (expect 0 rows for Downey)
- `feedback_stance_research_one_at_a_time`, `feedback_stance_research_all_topics`,
  `feedback_stance_no_default_value`, `feedback_compass_chairs_not_polarity` — stance discipline
- `feedback_headshot_no_graphics`, `feedback_headshot_image_sizing`, `feedback_headshot_cropping`,
  `feedback_headshot_resize_no_distort` — headshot discipline
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-20)

Gov: `City of Downey, California, US` = `1a31cf01-5e05-46d9-88f3-6b94aaa0c607`; geo_id NULL → `0619766`; state CA.

Two 'City Council' chambers under that gov (MERGE into one; both slug `downey-city-council`):
- `7cb8a90c-1214-4840-bd75-5f6b9504532d` (official_count 5) — 5 offices:
  - Claudia **Frometa** (675361, office `6fa79f0e`, At-Large LOCAL)
  - Dorothy **Pemberton** (675360, office `3718d3c0`, At-Large LOCAL)
  - Hector **Sosa** (675353, office `cc3bacd0`, At-Large **LOCAL_EXEC** → resolve per D-02a)
  - Alex **Saab** (-700160, office `44ca5c68`, At-Large LOCAL)
  - Don **Pelc** (-700161, office `2ecc0a3e`, At-Large LOCAL)
- `a30fd533-2188-4f36-bf23-a76d75296f2e` (official_count NULL) — 1 office:
  - Mario **Trujillo** (-201200, office `2afa4fd2`, At-Large LOCAL) — `last_name='-'`, first_name holds full
    name; sits alone in the orphan chamber → **prime stale-roster suspect**

Total = **6 offices for 5 real seats**. All council rows currently labeled `At-Large` → must become
`District 1`…`District 5`. The lone `LOCAL_EXEC` (Sosa) is almost certainly a mislabel given Downey's
rotational mayor.

**Roster currency: SUSPECT** (6 > 5). Research must confirm the current 5 district holders + who is the
current rotational mayor against the official Downey site.

Headshot status: **all 6 = 0 images** → Wave 3 is full greenfield. Stance status: **all 6 = 0 stances** →
Wave 4 is full greenfield.

Migration counters (live, 2026-06-20): `schema_migrations` registered MAX = 947; on-disk migrations MAX = 984
(`980–984` = `state_exec_seed` batches); `957–979` unused gap. → next ≈ **985**, re-confirm in pre-flight.
</code_context>

<specifics>
## Specific Ideas

- User explicitly chose to **defer the rotational-mayor / `LOCAL_EXEC`-row decision to research** (verify form
  of government against downeyca.org; apply Palmdale rotational pattern if confirmed — it almost certainly is).
- User accepted the locked 142–149 precedent for roster (unlink-not-delete), headshots (direct-first/operator
  fallback), and stances (evidence-only chairs) without further deep-dive.
</specifics>

<deferred>
## Deferred Ideas

- Downey Unified school district (gov `32e2fad0`) deep-seed — separate government, out of scope here.
- Run Downey's own split-section check (`feedback_section_split_check`) post-reconcile — expect 0 rows.
- Phase 157 (Wave-2 close-out) consumes Downey's final per-city counts — runs after all 15 cities seeded.

None beyond the above — discussion stayed within phase scope.
</deferred>

---

*Phase: 150-downey-deep-seed*
*Context gathered: 2026-06-20*
