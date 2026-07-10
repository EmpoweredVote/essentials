# Phase 149: Pasadena deep-seed - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Requirements:** PASA-01

<domain>
## Phase Boundary

Take **City of Pasadena** (geo_id `0656000`, gov `d25619a9-7276-4e8b-b7ae-8028e408aee0`) from a partial/
defective seed to full Tier-1 depth: government structure + correct current roster + headshots + evidence-only
compass stances. Same 4-wave deep-seed pattern as phases 142–148.

**⚠ This is a RECONCILE, not greenfield (DB-confirmed 2026-06-20):** the Pasadena gov already exists with
`geo_id` NULL, **two duplicate 'City Council' chambers**, and 8 offices (7 council + Mayor). Pasadena's real
form of government is **7 single-member districts + a directly-elected Mayor**, but the DB currently mislabels
all council rows as "At-Large."

**In scope:** City of Pasadena only. **NOT in scope:** South Pasadena (separate gov `1446b161`), Pasadena
Unified school district (`44aee817`), South Pasadena Unified (`b66426e8`) — all distinct governments.
</domain>

<decisions>
## Implementation Decisions

### Structure (Wave 1 — reconcile, registers in schema_migrations)
- **D-01 (reconcile not greenfield):** Backfill `essentials.governments.geo_id='0656000'` on gov `d25619a9`
  (guard `geo_id IS NULL OR geo_id=''`), then merge the two duplicate 'City Council' chambers
  (`2e7f01d0` official_count 8 + `bdd1acad` official_count NULL) into ONE chamber via move-then-delete
  (target by UUID — both share the name 'City Council'), asserting the doomed chamber is empty before delete.
  A Wave-1 STOP-on-drift pre-flight re-confirms both chamber UUIDs, the 8 offices, the roster, and the
  duplicate/defect set before any write.
- **D-05 (cleanup folded into Wave 1):** In the same reconcile — dedupe **Jason Lyon's** extra image row
  (657582 has 2 `politician_images`; keep exactly one canonical), and ensure **Jess Rivas** (-700150, office
  `7bdb4f77`, 0 images/0 stances) is correctly linked. Mechanics at Claude's discretion.

### Form of government (Wave 1 — BY-DISTRICT conversion)
- **D-02 (relabel At-Large → District 1–7):** Pasadena is **7 single-member districts + a directly-elected
  Mayor**. Use the proven **Pomona (147) / Palmdale (146) by-district relabel pattern**: relabel the existing
  wrongly-'At-Large' council district rows to `District 1`…`District 7` (LOCAL) and map each seated member to
  their **real district** (research-confirmed against the official Pasadena site). Create any missing district
  rows; do NOT tear down and rebuild. Keep the directly-elected Mayor on the existing `Pasadena Mayor`
  LOCAL_EXEC district (Victor Gordo, office `fc5e372a`) — Lancaster/Pomona model, no rotational flag.

### Roster (Wave 2 — current-seated)
- **D-03 (current-seated, retire departed):** Verify the roster against the official Pasadena site and seat
  whoever holds each seat **today**. The seeded names (Madison 657581, Masuda 657579, Cole 657577 in
  particular) are longtime members likely affected by Pasadena's 2024/2025 district elections — treat the
  seeded roster as SUSPECT until verified. For any departed member: **unlink** the office (null the office↔
  politician link / reassign to the current member) but **keep** their politician + stance + photo rows
  (the Whittier/Santa Monica unlink-not-delete precedent). Seat any new current members. Mayor Victor Gordo
  (-200901) verified current at research time. Final: one chamber, 7 districted council + 1 Mayor, consistent
  bidirectional links, `official_count=7` (council) per existing convention.

### Headshots (Wave 3 — audit-only migration)
- **D-04 (direct-first, operator fallback):** Try direct curl from cityofpasadena.net official portraits
  first. If WAF-403 (the torranceca.gov surprise), fall back to operator-supplied in-browser downloads +
  alternate hosts (SCAG, Ballotpedia, Wikimedia, campaign sites). Every portrait: identity-verified, no
  superimposed text, crop 4:5 FIRST → 600×750 Lanczos q90, uploaded to `politician_photos/{uuid}-headshot.jpg`
  (x-upsert), `type='default'`, `photo_license` matching the real source, `photo_origin_url` set. Honest gap
  if no acceptable verified portrait. Blocking human-verify checkpoint.

### Stances (Wave 4 — audit-only migrations)
- **Carried forward (locked by 142–148, not re-discussed):** evidence-only **CHAIRS** model (value = the
  chair the evidence matches, never a polarity axis); 100% citation (paired `inform.politician_answers` +
  `inform.politician_context` with reasoning + real source URLs); **no defaulted/neutral values**; honest
  blank spokes where no record exists; **NO judicial-* topics** (Pasadena has an appointed City Attorney —
  council-manager-with-elected-mayor); live non-judicial topics queried at apply time (never hardcoded
  retired IDs); ONE research agent at a time. Blocking human-verify checkpoint.

### Migration ledger convention (carried forward)
- Structural migrations (reconcile + roster) register in `supabase_migrations.schema_migrations`. Headshot +
  stance migrations are AUDIT-ONLY (raw SQL, NOT registered). On-disk file counter authoritative.
  **Next migration number = 946** (Torrance ended at ledger MAX 937; 938–945 were audit-only files;
  pre-flight must re-confirm the live MAX + on-disk counter before numbering).

### Verdict bar (carried forward)
- Structure-hard / data-soft (D-03 of phase 157): correct government + chamber + districted roster is the hard
  requirement; headshot gaps and thin/blank stance coverage are documented acceptable gaps.

### Claude's Discretion
- Exact district→member mapping (research-determined), per-member stance chairs, dedupe mechanics, and the
  precise reconcile SQL ordering (follow the 147/148 idempotent patterns).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 149: Pasadena deep-seed" — goal + 5 success criteria
- `.planning/REQUIREMENTS.md` — PASA-01 acceptance text

### Proven precedents to copy (by-district reconcile + deep-seed)
- `.planning/phases/147-pomona-deep-seed/` — PLANs/SUMMARYs/VERIFICATION: the direct by-district reconcile
  precedent (geo_id backfill + chamber merge + At-Large→District relabel + shared-district split)
- `.planning/phases/146-palmdale-deep-seed/146-CONTEXT.md` + plans — by-district relabel pattern, LOCAL_EXEC Mayor
- `.planning/phases/148-torrance-deep-seed/` — most recent deep-seed: reconcile/headshot/stance mechanics,
  WAF-403 handling, chairs-model stance reasoning, ledger-bypass convention
- `C:/EV-Accounts/backend/migrations/926_pomona_reconcile.sql` — idempotent reconcile SQL template
- `LOCATION-ONBOARDING.md` — §California Quick Reference (chambers.slug GENERATED, districts.state='CA',
  district_type on districts), §Step 4 Headshots (4:5 crop first → 600×750)

### Project memory (load relevant)
- `project_by_district_relabel_pattern` — Palmdale/Pomona relabel-existing-rows approach
- `project_v170_wave2_not_greenfield` — DB-precheck every city (confirmed true again for Pasadena)
- `feedback_section_split_check` — run after reconcile (expect 0 rows for Pasadena)
- `feedback_stance_*`, `feedback_compass_chairs_not_polarity` — stance discipline
</canonical_refs>

<code_context>
## DB Pre-Check (live, 2026-06-20)

Gov: `City of Pasadena, California, US` = `d25619a9-7276-4e8b-b7ae-8028e408aee0`; geo_id NULL → `0656000`; state CA.

Two 'City Council' chambers under that gov (MERGE into one):
- `2e7f01d0-69dd-4301-b24c-58d83eb19f47` (official_count 8) — 6 At-Large council offices:
  Rivas (-700150, office `7bdb4f77`, 0img/0stance) · Madison (657581, `f2cb13dd`) · Masuda (657579, `0bc62efd`) ·
  Cole (657577, `7ab2730c`) · Jones (657578, `e3617ff5`) · Lyon (657582, `0cd97f4e`, **2 images** → dedupe)
- `bdd1acad-f22d-4fa3-8ab5-667eed0e3d82` (official_count NULL) — 2 offices:
  **Mayor Victor M. Gordo** (-200901, office `fc5e372a`, district `Pasadena Mayor` LOCAL_EXEC) ·
  Tyron Hampton (-201094, office `0c357b48`, At-Large)

Total = 8 offices (7 council + 1 Mayor). All council rows currently `district_type='LOCAL'` label `At-Large`
→ must become `District 1`…`District 7`. Mayor row already LOCAL_EXEC (correct).

**Roster currency: SUSPECT.** Research must confirm the current 7 district holders + Mayor against the official
Pasadena site (2024/2025 district elections); Madison/Masuda/Cole flagged as likely-stale longtime members.

Headshot status: most members have 1 image (pre-existing, dimensions unverified); Rivas 0; Lyon 2. All have
0 stances — Wave 4 is full greenfield stances.
</code_context>

<deferred>
## Noted for Later
- Split-section defect sweep across the 5 known LA-area cities (`project_split_section_defects_5_cities`) — out of scope here; run Pasadena's own split-section check (expect 0 rows) post-reconcile.
- Phase 157 (Wave-2 close-out) consumes Pasadena's final per-city counts — runs after all 15 cities seeded.
</deferred>
