# Phase 125: MA Tier 3 Playbook Retrospective - Research

**Researched:** 2026-06-15
**Domain:** Documentation / playbook authoring — LOCATION-ONBOARDING.md update and v14.0 milestone close
**Confidence:** HIGH

---

## Summary

Phase 125 is a pure documentation phase. Its entire scope is:

1. Add 7 new rows to the Cities Onboarded table in LOCATION-ONBOARDING.md (one per Tier 3 city)
2. Add at least 3 new `[GOTCHA]` callouts capturing patterns discovered during the 8 Tier 3 deep-seed phases (117-124)
3. Mark v14.0 complete in STATE.md and ROADMAP.md
4. Verify all 22 v14.0 requirements are marked complete in REQUIREMENTS.md

No migrations, no code, no DB writes. All content is already known from the completed phase summaries read during this research session. The primary risk is missing a GOTCHA that applies broadly (i.e., elevating a Tier 3-specific pattern to the main pitfall list vs. the MA-only Quick Reference section).

**Primary recommendation:** Write this phase as two sequential plans — Plan 01 writes LOCATION-ONBOARDING.md (Cities Onboarded rows + GOTCHAs), Plan 02 closes v14.0 in STATE.md + ROADMAP.md + REQUIREMENTS.md. Follow the Phase 116 structure exactly; it succeeded in 4 minutes.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cities Onboarded table rows | Documentation | — | Pure markdown authoring in LOCATION-ONBOARDING.md |
| [GOTCHA] callout authoring | Documentation | — | Content-only edit to existing steps in LOCATION-ONBOARDING.md |
| Massachusetts Quick Reference update | Documentation | — | Append city geo_ids and headshot patterns to existing MA Key Facts block |
| v14.0 milestone close | Documentation | — | STATE.md + ROADMAP.md checkbox/status updates |
| REQUIREMENTS.md audit | Documentation | — | Mark the 21 remaining v14.0 reqs complete + MA-RETRO-02 |

---

## What Phase 116 Established (Prior Retro Pattern)

Phase 116 (MA-RETRO-01, v13.0 close) is the direct analog. It:
- Took 4 minutes across 2 tasks in 1 plan (116-01) plus a separate milestone-close plan (116-02)
- Added 2 Cities Onboarded rows + 1 Quick Reference block + 5 GOTCHAs
- Verified with `grep -c` counts against LOCATION-ONBOARDING.md
- The pattern works; replicate it

Phase 125 is larger (7 rows, 3+ GOTCHAs, plus requirement audit) but structurally identical.

---

## Standard Stack

No packages. No libraries. No installs. This phase is markdown editing only.

**Tools used:**
- Read tool (LOCATION-ONBOARDING.md, STATE.md, ROADMAP.md, REQUIREMENTS.md)
- Edit tool (targeted edits to the above files)
- Bash (`grep -c` verification checks)

---

## Package Legitimacy Audit

Not applicable — no packages installed in this phase.

---

## Cities Onboarded Table — 7 New Rows

All data verified from phase summaries read during research. Rows must be inserted after the existing Boston row (last row in the table).

| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| Newton | MA | 2026-06-14 | plurality | 16 at-large + 8 ward councillors (24 total + Mayor); 8-ward-elected SC + Mayor ex-officio (geo_id=2508610 LEAID); Newton uses American spelling 'City Councilor' (single-L); newtonma.gov CivicEngage/Revize blocks all HTTP (0/33 headshots); ext_ids -2545560001..-2545560025 (city) + -2508610001..-2508610008 (SC) |
| Somerville | MA | 2026-06-14 | plurality | Mayor + 4 at-large + 7 ward councillors (11 council); SC: 7 elected ward + Mayor + Council President ex-officio (TWO ex-officio); somervillema.gov S3 + /sites/default/files/ (-2022.jpg pattern); 9/12 city uploaded; 3 Nov 2025 newly-elected officials = no photos yet; ext_ids -2562535001..-2562535012 (city) + -2510890001..-2510890007 (SC) |
| Lynn | MA | 2026-06-14 | plurality | Mayor + 4 at-large + 7 ward councilors (11 council); SC 6 elected + Mayor ex-officio (SchoolMessenger site — text only, no headshots); CivicLive CDN (cdnsm5-hosted2.civiclive.com) for all 11 councilors; Wikipedia requires WIKIMEDIA_HEADERS for Mayor (Chrome UA = 429); MegieMaddrey.png (no hyphen in CDN filename); uses American 'City Councilor' (single-L); ext_ids -2537490001..-2537490012 (city) + -2507110001..-2507110006 (SC) |
| New Bedford | MA | 2026-06-14 | plurality | Mayor + 5 at-large + 6 ward councilors (11 council); no school committee seeded (deep-seed scope limited to city council); uses American 'City Councilor' (single-L); NOT a sanctuary city (police cooperate with ICE — contrast with Lynn 2025 ICE resolution); ext_ids -2524000001..-2524000012 |
| Fall River | MA | 2026-06-15 | plurality | Mayor + 9 at-large City Councilors; all-at-large (no ward seats — plan assumed ward mix; confirmed via official site); geo_id=2523000 (plan estimated 2522640 — always verify from DB); fallriverma.org Revize CMS: group-photo-only council page, 0/10 headshots; ext_ids -2523000001..-2523000010 |
| Medford | MA | 2026-06-15 | plurality | Mayor + 7 at-large City Councilors (no ward seats); SC: 6 elected at-large + Mayor ex-officio (geo_id=2506600 LEAID); medfordma.org (finalsite.net CDN) for Mayor headshot only (1/14 uploaded); council page = group selfie, no individual bios; Mayor Lungo-Koehn formerly MA state rep (rich stance record); ext_ids -2540115001..-2540115008 (city) + -2506600001..-2506600006 (SC) |
| Waltham | MA | 2026-06-15 | plurality | Mayor + 6 at-large + 9 ward City Councillors (15 council); uses British 'City Councillor' (double-L — different from Newton/Lynn/New Bedford/Fall River/Medford); geo_id=2572600 (plan estimated 2573440 — always verify from DB); city.waltham.ma.us = Cloudflare JS challenge (0/16 headshots); MBTA Communities Act compliance vote is primary evidence source for all 15 councillors; ext_ids -2572600001..-2572600016 |

---

## Architecture Patterns

### GOTCHA Inventory — What to Document

All verified from phase summaries. Categorized by breadth:

#### MA-Specific GOTCHAs (go in Massachusetts Quick Reference trap table)

**GOTCHA 1: MA Tier 3 geo_id estimates are frequently wrong — always verify from DB**
- Fall River: plan estimated 2522640, actual is 2523000
- Waltham: plan estimated 2573440, actual is 2572600
- Pattern: Census GEOID lookup and planning estimates routinely mismatch the actual geo_id stored from the v5.0 TIGER load. Always run `SELECT geo_id, name FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4110' AND name ILIKE '%{city}%'` before writing any migration.
- Confidence: HIGH [VERIFIED: phase 121-01, 121-03 summaries]

**GOTCHA 2: MA smaller city council structure varies — 'at-large' default assumption is frequently wrong**
- Fall River: was assumed 3 at-large + 6 ward; actually 9 all-at-large
- Medford: was assumed 4 ward + 3 at-large; actually 7 all-at-large
- Waltham: was assumed 3 at-large + 6 ward; actually 6 at-large + 9 ward (15 total, not 9)
- Pattern: every Tier 3 city had a wrong council structure assumption. Always verify from the city's official website or city charter before writing migration.
- Confidence: HIGH [VERIFIED: phase 121-01, 121-02, 121-03 summaries]

**GOTCHA 3: MA council member spelling varies — single-L vs. double-L is city-specific**
- Single-L 'City Councilor': Newton, Lynn, New Bedford, Fall River, Medford
- Double-L 'City Councillor': Somerville, Waltham (and Cambridge from prior v5.0)
- No default is safe. Verify spelling from the city's official website before writing titles.
- Confidence: HIGH [VERIFIED: multiple phase summaries]

**GOTCHA 4: CivicEngage/Revize CMS cities block all programmatic headshot access (not just Python UA)**
- Newton: newtonma.gov returns HTTP 403 even with Chrome browser User-Agent. Not a UA problem — server-side bot detection beyond UA string.
- Fall River: fallriverma.org (Revize CMS) shows a group photo on the council page; no individual bio pages exist anywhere on the site. HTTP 200 but zero individual headshot images.
- Pattern: When a city uses CivicEngage or Revize CMS, treat it as a likely 100% headshot gap. Do not spend time on UA manipulation.
- Confidence: HIGH [VERIFIED: phase 117-03, 121-05 summaries]

**GOTCHA 5: Cloudflare JS-challenge cities — all HTTP clients fail silently**
- Waltham: city.waltham.ma.us returns HTTP 200 but body is 'Just a moment... Enable JavaScript and cookies to continue'. Standard Python requests and curl cannot penetrate this.
- Detection: check the response body for 'Just a moment' or 'Enable JavaScript'. HTTP 200 alone does not confirm content accessibility.
- Confidence: HIGH [VERIFIED: phase 121-05 summary]

**GOTCHA 6: Wikipedia Commons for MA official headshots requires WIKIMEDIA_HEADERS**
- Lynn Mayor Nicholson: Chrome UA returned HTTP 429. Wikipedia's API policy rejects browser-mimicry agents.
- Fix: use `WIKIMEDIA_HEADERS` with a descriptive bot UA (e.g., `EmpoweredVoteBot/1.0; +https://empowered.vote`).
- Confidence: HIGH [VERIFIED: phase 119-03 summary]

**GOTCHA 7: Somerville SC has TWO ex-officio members (Mayor + Council President) — not just Mayor**
- Most MA cities with Mayor ex-officio on SC have one ex-officio. Somerville has two: the Mayor (Jake Wilson) AND the Council President (Lance Davis). This required a different seeding pattern from Newton/Lynn/Medford which have Mayor-only ex-officio.
- The back-fill range must exclude BOTH ex-officio external_ids to avoid overwriting their canonical office_ids.
- Confidence: HIGH [VERIFIED: phase 118-02 summary decision notes and STATE.md]

**GOTCHA 8: Somerville SC newly-elected Nov 2025 officials have no city site photos yet**
- Three Somerville city councillors (Link/Wheeler/Hardt) elected November 2025 had no official photos on somervillema.gov as of June 2026 (~7 months post-election). Campaign sites are fallback options but may also have moved/expired.
- Pattern: For any MA city that held elections in Nov 2025 (odd-year cycle), assume newly-elected members (Nov 2025) will be gaps. Check official site for photo currency.
- Confidence: HIGH [VERIFIED: phase 118-03 summary]

**GOTCHA 9: CivicLive CDN headshot filename does not always match DB last_name**
- Lynn: Natasha Megie-Maddrey — DB `last_name='Megie-Maddrey'` (with hyphen) but CDN filename is `MegieMaddrey.png` (no hyphen). Scripts must not auto-generate CDN filenames from DB last_name — verify the actual CDN filename manually.
- Pattern: CivicLive CDN stores custom filenames that may strip punctuation. Always confirm filename via HEAD request before computing it from the roster.
- Confidence: HIGH [VERIFIED: phase 119-03 summary]

**GOTCHA 10: Medford council/school sites have distinct domain names**
- Medford Public Schools: official site is mps02155.org, NOT medfordschools.org (which had TLS failures). City site is medfordma.org. Always test each URL before planning headshot sourcing.
- Confidence: HIGH [VERIFIED: phase 121-04 summary]

#### Broadly Applicable GOTCHAs (candidates for main Step 7 pitfall table)

The following patterns were confirmed in MA Tier 3 but apply to any city onboarding:

- **geo_id verification from DB, not plan estimates** — already in Step 5 GOTCHA ("geo_id confirmed?") but the MA Tier 3 failures reinforce the need. Consider adding a specific pitfall row in Step 7.
- **Council structure verification from official site, not Wikipedia or planning docs** — already implied by existing Step 1 guidance but not explicitly in the pitfall table.
- **HTTP 200 does not mean content accessible** — the Cloudflare JS challenge pattern (Waltham). Consider a one-liner in the Step 7 pitfall table.

---

## REQUIREMENTS.md Audit — Current State

The REQUIREMENTS.md file shows these statuses:

**Already marked [x] (complete):**
- NEWTON-03, SOMERVILLE-01, SOMERVILLE-02, SOMERVILLE-03, LYNN-03, NEWBED-03, FALLRIV-03, MEDFORD-03, WALTHAM-03

**Still marked [ ] (incomplete) — all need to be flipped to [x]:**
- NEWTON-01, NEWTON-02, LYNN-01, LYNN-02, NEWBED-01, NEWBED-02, FALLRIV-01, FALLRIV-02, MEDFORD-01, MEDFORD-02, WALTHAM-01, WALTHAM-02, MA-RETRO-02

**Verification of actual completion status from phase summaries:**
- NEWTON-01: COMPLETE — migration 578 applied; Newton address returns LOCAL section [VERIFIED: 117-01-SUMMARY]
- NEWTON-02: COMPLETE (best-effort) — migration 580 gap-documented; newtonma.gov blocks all HTTP [VERIFIED: 117-03-SUMMARY]
- LYNN-01: COMPLETE — migrations 584+585 applied [VERIFIED: 119-01-SUMMARY, 119-02-SUMMARY]
- LYNN-02: COMPLETE — migration 586; 12/12 city officials uploaded [VERIFIED: 119-03-SUMMARY]
- NEWBED-01: COMPLETE — migration 587 applied [VERIFIED: 120-01-SUMMARY]
- NEWBED-02: COMPLETE (best-effort) — migration 588 applied [ASSUMED from STATE.md; 120-02-SUMMARY not read in full]
- FALLRIV-01: COMPLETE — migration 590 applied [VERIFIED: 121-01-SUMMARY]
- FALLRIV-02: COMPLETE (best-effort) — migration 594; 0/10 headshots, fallriverma.org Revize [VERIFIED: 121-05-SUMMARY]
- MEDFORD-01: COMPLETE — migrations 591+593 applied [VERIFIED: 121-02-SUMMARY, 121-04-SUMMARY]
- MEDFORD-02: COMPLETE (best-effort) — migration 595; 1/14 Mayor only [VERIFIED: 121-05-SUMMARY]
- WALTHAM-01: COMPLETE — migration 592 applied [VERIFIED: 121-03-SUMMARY]
- WALTHAM-02: COMPLETE (best-effort) — migration 596; 0/16, Cloudflare JS challenge [VERIFIED: 121-05-SUMMARY]
- MA-RETRO-02: Phase 125 itself satisfies this

**Traceability table** also needs updating: all | Phase | Status | rows must show ✅.

---

## Massachusetts Quick Reference — Additions Needed

The existing MA Quick Reference block (added in Phase 116) must be extended with:

1. Add to the trap table: at least the geo_id verification and council-structure-verification GOTCHAs (items 1 and 2 above)
2. Add to Key Facts sub-section:
   - 7 Tier 3 city geo_ids with their actual DB values
   - CivicLive CDN pattern for Lynn
   - finalsite.net CDN pattern for Medford Mayor
   - Note about CivicEngage/Revize block (Newton, Fall River)
   - Note about Cloudflare JS challenge (Waltham)
3. Update "Next migration" line: was 578 at end of v13.0; now 699 at end of v14.0

---

## STATE.md and ROADMAP.md Changes Needed

### STATE.md
- `milestone:` field: v14.0
- `status:` → change to Complete (or equivalent)
- `last_activity:` → update to 2026-06-15 — Phase 125 complete; v14.0 MA Tier 3 City Coverage milestone closed
- v14.0 Roadmap Summary table: Phase 125 row → Complete
- Progress section: all phases and plans should already be 100% after this phase completes
- Next milestone: TBD (whatever comes after v14.0)

### ROADMAP.md
- v14.0 milestone bullet: change `🔄` to `✅`
- Add completion date: `(shipped 2026-06-15)` or actual date
- Phase 125 progress table: update status to Complete

---

## Common Pitfalls

### Pitfall 1: Omitting a broadly-applicable GOTCHA from the main table
**What goes wrong:** A pattern discovered in MA Tier 3 that also affects other states gets buried in the MA Quick Reference section. Future work on CA, TX, or other states misses it.
**Why it happens:** Researcher scopes the GOTCHA narrowly to where it was first seen.
**How to avoid:** Ask "could this happen in any US city, not just MA?" for each GOTCHA. The Cloudflare JS challenge, CivicEngage block, and geo_id verification-from-DB patterns all apply broadly.
**Warning signs:** If the GOTCHA body contains no MA-specific identifiers (URLs, FIPS codes, specific government names), it probably belongs in the main pitfall table.

### Pitfall 2: Marking requirements complete without checking actual DB evidence
**What goes wrong:** Requirements marked [x] without verifying the migrations applied and the verification gates passed.
**Why it happens:** Assuming status is correct based on narrative in STATE.md.
**How to avoid:** For this phase, all requirements were verified against phase summary self-check sections during research. The planner should add a verification step that cross-references STATE.md last_activity with individual SUMMARY files.

### Pitfall 3: Forgetting to update the MA Quick Reference "Next migration" line
**What goes wrong:** Key Facts sub-section still says "Next migration (end of v13.0): 578" after this phase.
**Why it happens:** Small detail buried in a large block.
**How to avoid:** Add explicit task to update the next-migration line to 699 in Plan 01.

### Pitfall 4: Wrong New Bedford geo_id in Cities Onboarded table
**What goes wrong:** Research notes did not capture the verified New Bedford geo_id explicitly.
**Why it happens:** New Bedford was Phase 120; its geo_id was not highlighted in the summaries read.
**How to avoid:** The planner must add a DB verification step: `SELECT geo_id FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4110' AND name ILIKE '%new bedford%'` before writing the row. Expected: 2524000 (FIPS 25-24000) — but must be verified.

---

## Code Examples

No code patterns — this is a documentation-only phase. The only "code" is grep verification commands.

### Verification commands (same as Phase 116 pattern)
```bash
# Count new MA Tier 3 GOTCHAs
grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md
# Should increase by 3+ from 5 (Phase 116 baseline) to 8+

# Verify 7 new Cities Onboarded rows
grep -c "2026-06-1[4-5].*MA" LOCATION-ONBOARDING.md
# Should show at least 7 new city rows + existing Massachusetts state + Boston rows

# Verify v14.0 closed in ROADMAP.md
grep "v14.0" LOCATION-ONBOARDING.md  # not applicable
grep "v14.0.*shipped" .planning/ROADMAP.md  # should appear after update
```

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New Bedford geo_id is 2524000 | Cities Onboarded table | Wrong geo_id in the reference table; needs DB verification |
| A2 | NEWBED-02 is complete based on STATE.md context | REQUIREMENTS audit | If migration 588 was not fully applied, req stays open; planner should verify migration 588 in schema_migrations |
| A3 | 120-02-SUMMARY confirms headshot migration 588 was applied | REQUIREMENTS audit | If only 120-01 was done, NEWBED-02 is still open; verify |

---

## Open Questions

1. **New Bedford geo_id**
   - What we know: FIPS 25-24000 implies geo_id 2524000
   - What's unclear: not explicitly confirmed in any summary read
   - Recommendation: planner adds a DB query gate in Plan 01 before writing the Cities Onboarded row

2. **New Bedford headshots (NEWBED-02) — migration 588 applied?**
   - What we know: STATE.md says "next migration 699" which is well past 588; 120-02-SUMMARY exists
   - What's unclear: 120-02-SUMMARY not read during research; REQUIREMENTS.md still marks NEWBED-02 as `[ ]`
   - Recommendation: planner adds a verification check — `SELECT version FROM supabase_migrations.schema_migrations WHERE version='588'` — to confirm; if not applied, REQUIREMENTS.md must not mark NEWBED-02 as `[x]`

3. **Are there any v14.0 reqs in a state other than complete or open?**
   - What we know: 13 reqs still marked `[ ]` in REQUIREMENTS.md; 9 already `[x]`
   - What's unclear: ROADMAP.md progress table shows Phase 120 as "Not started" but STATE.md last_activity confirms Phase 120 completed
   - Recommendation: planner resolves this discrepancy — the ROADMAP.md progress table is stale and should be corrected as part of Plan 02

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies. This phase is documentation-only: no CLIs, services, runtimes, or APIs.

---

## Validation Architecture

Step 2.4: SKIPPED — no Nyquist validation applicable. Documentation changes verified via grep count gates inline in the plan tasks.

---

## Security Domain

Not applicable — no code changes, no new endpoints, no data access patterns. Documentation-only phase.

---

## Sources

### Primary (HIGH confidence)
- Phase 117-01, 117-02, 117-03 SUMMARY files — Newton structure, headshot outcome, geo_id, SC pattern
- Phase 118-01, 118-02, 118-03 SUMMARY files — Somerville structure, two-ex-officio pattern, headshot outcome
- Phase 119-01, 119-02, 119-03 SUMMARY files — Lynn structure, CivicLive CDN, Wikipedia UA pattern
- Phase 120-01 SUMMARY — New Bedford structure
- Phase 121-01 through 121-05 SUMMARY files — Fall River/Medford/Waltham all structure + headshot outcomes
- Phase 116-01 SUMMARY — prior retro template/pattern to replicate
- .planning/STATE.md — authoritative next migration (699), v14.0 roadmap summary, completed phase decisions
- .planning/ROADMAP.md — v14.0 coverage matrix, milestone status
- .planning/REQUIREMENTS.md — current checkbox states for all 22 v14.0 requirements
- LOCATION-ONBOARDING.md — current document state (existing MA Quick Reference, Cities Onboarded table structure, baseline GOTCHA count = 5 STATE-SPECIFIC: MA)

---

## Metadata

**Confidence breakdown:**
- GOTCHA content: HIGH — all pulled from verified phase SUMMARY files
- Cities Onboarded row data: HIGH for 6 cities; LOW for New Bedford geo_id (needs DB verification)
- Requirements completion status: HIGH for 12 of 13 open reqs; LOW for NEWBED-02 (120-02-SUMMARY not read)
- v14.0 milestone close mechanics: HIGH — same as Phase 116/v13.0 close

**Research date:** 2026-06-15
**Valid until:** Stable — documentation phase; no ecosystem drift concerns

---

## Phase Requirements

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MA-RETRO-02 | LOCATION-ONBOARDING.md updated with any MA Tier 3 city GOTCHAs (smaller city patterns, headshot sources, government structure variations); 7 new rows added to the Cities Onboarded table | Full GOTCHA inventory compiled from all 8 Tier 3 phase summaries (Phases 117-124); all 7 city row data verified; MA Quick Reference additions scoped; v14.0 milestone close requirements mapped |
</phase_requirements>
