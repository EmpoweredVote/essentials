---
phase: 217-browse-geo-id-reconcile
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md
  - .planning/REQUIREMENTS.md
autonomous: true
requirements:
  - COLLIN-BROWSE-01
  - COLLIN-BROWSE-02
  - COLLIN-BROWSE-03
  - COLLIN-BROWSE-04

must_haves:
  truths:
    - "All 5 previously-flagged Collin cities (Plano, Richardson, Prosper, Princeton, Van Alstyne) resolve to a real government with a seated roster via the browse path."
    - "The corrected geo_id mapping (label → current coverage.js geo_id → resolved government → seated count, with the phantom code that was NEVER in current code) is documented."
    - "REQUIREMENTS.md COLLIN-BROWSE-01..04 are marked met with the ACTUAL corrected geo_ids, and the stale 4863000-style claim is corrected."
    - "The 5-city completeness gaps (vacancies / zero-race / web_form_url / email) are logged as explicit follow-ups, not fixed."
  artifacts:
    - ".planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md"
    - ".planning/REQUIREMENTS.md (COLLIN-BROWSE section corrected + Traceability flipped to Met)"
  key_links:
    - "coverage.js Texas geo_ids ↔ essentials.governments rows (already correct; this plan documents, does not change)"
    - "REQUIREMENTS.md COLLIN-BROWSE claims ↔ verified production evidence in 217-CONTEXT.md"
---

<objective>
Verify and document that all 23 Collin County, TX browse geo_ids (24 Texas
`coverage.js` entries incl. Longview) already resolve to real
`essentials.governments` rows with seated rosters — the roadmap/REQUIREMENTS
premise that 5 cities "resolve to nothing" (e.g. Plano `4863000`) is STALE and the
bug was fixed in `src/lib/coverage.js` at an earlier point (per D-01, verified
against production DB during discuss 2026-07-23).

This is a DOC-ONLY verify + document task. NO edits to `src/`, NO migrations, NO DB
writes, NO `coverage.js` geo_id changes (they are already correct).

Purpose: Close Phase 217's browse-reconcile requirements against reality, correct the
stale planning artifacts, and log the 5-city completeness gaps as follow-ups
(log-not-absorb, per D-04).
Output: `260723-lfc-GEOID-MAPPING.md` (corrected mapping + follow-up log + live
browse links) and a corrected `.planning/REQUIREMENTS.md` COLLIN-BROWSE section.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/phases/217-browse-geo-id-reconcile/217-CONTEXT.md
@.planning/REQUIREMENTS.md

# The executor has NO Supabase MCP and CANNOT run DB queries. The DB-verified
# resolution + roster evidence is already recorded in 217-CONTEXT.md (canonical_refs
# + specifics sections) — treat it as authoritative source data, do NOT re-derive.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Read-only live browse spot-check of the 5 flagged cities</name>
  <files>(no file writes — evidence capture only, feeds Task 2)</files>
  <action>
    Perform a READ-ONLY live browse HTTP spot-check of the 5 previously-flagged
    cities via the public browse path (per D-05). For each city, request the live
    browse URL and confirm the response renders/returns officials for that
    government. Do NOT wipe localStorage, do NOT seed, do NOT POST — read-only GET
    only (per project rule no_playwright_on_user_live_browser).

    URLs to check (label → geo_id, the geo_ids ALREADY in coverage.js):
    - Plano: https://essentials.empowered.vote/results?browse_government_list=4858016&browse_label=Plano&browse_state=TX (expect ~8 seated)
    - Richardson: https://essentials.empowered.vote/results?browse_government_list=4861796&browse_label=Richardson&browse_state=TX (expect 7 seated)
    - Prosper: https://essentials.empowered.vote/results?browse_government_list=4859696&browse_label=Prosper&browse_state=TX (expect 7 seated)
    - Princeton: https://essentials.empowered.vote/results?browse_government_list=4859576&browse_label=Princeton&browse_state=TX (expect 7 seated)
    - Van Alstyne: https://essentials.empowered.vote/results?browse_government_list=4874924&browse_label=Van+Alstyne&browse_state=TX (expect 5 seated)

    Because /results is a client-rendered SPA, a raw HTML GET may not show roster
    rows directly. Acceptable evidence, in priority order: (a) the SPA shell loads
    HTTP 200 for each URL and the by-government-list browse endpoint
    (POST /api/essentials/browse/by-government-list on accounts-api.empowered.vote)
    returns officials for each geo_id; (b) if live HTTP is not reachable from the
    executor environment, FALL BACK to citing the DB-verified evidence already in
    217-CONTEXT.md (canonical_refs seated counts + specifics table) and note that the
    live browse link set is provided for operator confirmation. Record which
    evidence path was used per city.
  </action>
  <verify>
    <automated>MISSING — no test harness for live SPA browse; verification is the operator-facing evidence record captured in Task 2's mapping doc (live HTTP result or explicit 217-CONTEXT.md fallback citation per city).</automated>
  </verify>
  <done>Each of the 5 cities has a recorded resolution result: either a live HTTP/endpoint confirmation, or an explicit fallback to the 217-CONTEXT.md DB evidence with the live browse link provided for operator confirmation. No writes, no seeding performed.</done>
</task>

<task type="auto">
  <name>Task 2: Write the corrected geo_id mapping + 5-city follow-up log</name>
  <files>.planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md</files>
  <action>
    Create the mapping/follow-up document. It must contain three sections:

    1. Corrected geo_id mapping table for all 5 flagged cities, columns:
       City label | current coverage.js geo_id | resolved government | seated count |
       phantom code (NEVER present in current src). Use the verified values from
       217-CONTEXT.md canonical_refs: Plano 4858016 → City of Plano, 8 seated
       (phantom 4863000); Richardson 4861796 → City of Richardson, 7 seated (phantom
       4863500); Prosper 4859696 → Town of Prosper, 7 seated (phantom 4863276);
       Princeton 4859576 → City of Princeton, 7 seated (phantom 4863432); Van Alstyne
       4874924 → City of Van Alstyne, 5 seated (phantom 4875960). State clearly that
       coverage.js already carries the corrected geo_ids and the phantom codes appear
       nowhere in current `src` (Landing.jsx reads solely from coverage.js — no second
       hardcoded Collin list). Note all 24 Texas coverage.js entries resolve in
       production.

    2. Live browse links (the 5 URLs from Task 1) for operator confirmation, plus the
       resolution evidence result recorded per city in Task 1 (live HTTP vs.
       217-CONTEXT.md fallback).

    3. 5-city completeness follow-up log (log-not-absorb per D-04 — DOCUMENTED, NOT
       fixed). Reproduce the spot-check findings from 217-CONTEXT.md specifics: the
       per-city offices/vacant/races/web_form_url/email table, then the explicit
       follow-up list: 4 vacant offices (Plano 1, Princeton 1, Van Alstyne 2); 3
       zero-race cities (Plano, Richardson, Van Alstyne); web_form_url empty across all
       5; missing emails in Prosper/Princeton/Van Alstyne; valid_to populated for all
       seated. Note these 5 govs are OUTSIDE the 18-government set that Phases 218–220
       operate on — candidates for a follow-up phase or a scoped 219/220 extension.

    Also add a short note that Phase 217's ROADMAP success criteria are satisfied by
    this quick task, for the operator to reconcile at milestone close (do NOT edit
    ROADMAP.md here).
  </action>
  <verify>
    <automated>test -f ".planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md" && grep -q 4858016 ".planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md" && grep -q 4874924 ".planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-GEOID-MAPPING.md"</automated>
  </verify>
  <done>Mapping doc exists with all 5 corrected geo_ids, resolved governments, seated counts, phantom codes, the 5 live browse links, and the follow-up gap log (vacancies / zero-race / web_form_url / email) explicitly marked as logged-not-fixed.</done>
</task>

<task type="auto">
  <name>Task 3: Correct REQUIREMENTS.md — mark COLLIN-BROWSE met and fix stale codes</name>
  <files>.planning/REQUIREMENTS.md</files>
  <action>
    Update `.planning/REQUIREMENTS.md` (per D-03) with scoped Edit operations — do NOT
    rewrite the whole file:

    1. In the "Browse geo_id reconcile (COLLIN-BROWSE)" section, correct the stale
       premise. The intro paragraph claiming "5 of the 23 hardcoded Collin browse
       geo_ids resolve to no essentials.governments row … wrong FIPS place codes"
       must be corrected to reflect reality: the geo_ids in coverage.js were ALREADY
       correct as of the 2026-07-23 verification; all 24 Texas entries resolve in
       production; the earlier "4863000-style" codes were a stale 82-day-old memory
       snapshot, never present in current `src`. Keep the correction concise and cite
       the mapping doc.

    2. Mark the four items met. Change the checkboxes `- [ ]` to `- [x]` for
       COLLIN-BROWSE-01, -02, -03, -04, and update their inline text so any
       "currently empty" / phantom-`4863000` language is replaced with the correct
       resolved geo_id (Plano 4858016, Richardson 4861796, Prosper 4859696, Princeton
       4859576, Van Alstyne 4874924) and "resolves / renders officials".

    3. In the Traceability table, flip the Status for COLLIN-BROWSE-01..04 from
       "Pending" to "Met" (leave 218–220 rows untouched).

    Do NOT touch the ELECT / CONTACT / PEOPLE requirement rows or any Phase 218–220
    content. Do NOT edit ROADMAP.md.
  </action>
  <verify>
    <automated>grep -c '^\- \[x\] \*\*COLLIN-BROWSE-0[1-4]\*\*' .planning/REQUIREMENTS.md | grep -qx 4 && ! grep -q '4863000' .planning/REQUIREMENTS.md</automated>
  </verify>
  <done>COLLIN-BROWSE-01..04 are checked `[x]` with corrected geo_id text, the stale premise paragraph is corrected, the Traceability Status column reads "Met" for all four, no phantom `4863000`-style code remains, and no other requirement rows changed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| executor → live essentials.empowered.vote | Read-only GET spot-check only; no writes, no auth, no localStorage mutation. No new trust boundary introduced. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-217-01 | Tampering | Live browse spot-check | low | mitigate | Read-only GET / endpoint queries only; no seeding, no localStorage wipes (per no_playwright_on_user_live_browser). No DB writes, no migrations, no src edits in this plan. |
| T-217-02 | Information Disclosure | Documented geo_ids/rosters | low | accept | All values are already public browse data; documenting them in .planning/ adds no exposure. |
</threat_model>

<verification>
- All 5 flagged cities have a recorded resolution result (live or CONTEXT-fallback).
- Mapping doc contains all 5 corrected geo_ids, resolved govs, seated counts, phantom codes, 5 live browse links, and the follow-up gap log.
- REQUIREMENTS.md: COLLIN-BROWSE-01..04 checked + Traceability "Met"; no `4863000`-style phantom code remains; stale premise corrected.
- No `src/` files, migrations, or DB writes touched.
</verification>

<success_criteria>
- Phase 217 browse-reconcile requirements documented as met against verified production reality.
- Stale planning premise corrected in REQUIREMENTS.md.
- 5-city completeness gaps logged as explicit follow-ups (not fixed).
- Live browse links provided for operator confirmation.
</success_criteria>

<output>
Create `.planning/quick/260723-lfc-phase-217-verify-document-confirm-all-23/260723-lfc-SUMMARY.md` when done.
(The orchestrator handles the docs commit — do NOT commit SUMMARY/STATE/PLAN artifacts.)
</output>
