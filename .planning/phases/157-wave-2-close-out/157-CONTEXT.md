# Phase 157: Wave 2 close-out - Context

**Gathered:** 2026-06-19
**Updated:** 2026-06-22 (all 15 city phases landed; revised after actual wave outcomes)
**Status:** Ready for planning / execution

<domain>
## Phase Boundary

Close out the v17.0 "LA County City Coverage — Wave 2" milestone. Three deliverables, no new city seeding:

1. **Surface** — Make all 15 Wave-2 cities (Long Beach, Santa Clarita, Glendale, Lancaster, Palmdale, Pomona, Torrance, Pasadena, Downey, El Monte, West Covina, Inglewood, Burbank, Norwalk, Bellflower) present in `src/pages/Landing.jsx` `COVERAGE_STATES` (CA block, alphabetical) with correct browse wiring.
2. **Capture learnings** — Update `LOCATION-ONBOARDING.md` with any LA-County-Wave-2 GOTCHAs + "Cities Onboarded" rows for the 15 cities.
3. **Audit + close** — Write the DB-verified v17.0 milestone audit and formally close the milestone in MILESTONES.md / STATE.md / PROJECT.md.

This is a retrospective/surfacing phase. NOT in scope: seeding/reconciling city data, fixing pre-existing data defects, adding compass stances.

**✓ Sequencing dependency LIFTED (2026-06-22):** All 15 Wave-2 city phases (142–156) are now complete — Phase 156 (Bellflower) was the last, finished 2026-06-22. The earlier "do NOT execute until all cities land" hold no longer applies; 157 is clear to plan and execute.
</domain>

<decisions>
## Implementation Decisions

### Landing.jsx surfacing (Success criterion 1)
- **D-01:** List **all 15** Wave-2 cities as browsable entries in the CA block of `COVERAGE_STATES` (alphabetical), each with `browseGovernmentList: ['<geo_id>']` + `browseStateAbbrev: 'CA'`. Geo_ids per ROADMAP/STATE: Long Beach 0643000 · Santa Clarita 0669088 · Glendale 0630000 · Lancaster 0640130 · Palmdale 0655156 · Pomona 0658072 · Torrance 0680000 · Pasadena 0656000 · Downey 0619766 · El Monte 0622230 · West Covina 0684200 · Inglewood 0636546 · Burbank 0608954 · Norwalk 0652526 · Bellflower 0604982.
- **D-02:** Set `hasContext: true` (purple chip) **only for cities that have ≥1 seeded compass stance**. A city that finishes with a roster + headshots but 0 stances (honest blank) is still listed and browsable, but stays plain (no purple chip). This keeps the chip's "has compass context" promise honest and matches the existing `Landing.jsx:9` comment semantics. Determine the per-city stance count from the DB at audit time, not from assumption.

### Milestone audit pass bar (Success criterion 3)
- **D-03:** Audit verdict is **structure-hard / data-soft**. HARD requirement (blocks close if missing): each of the 15 cities has government + chamber + correct roster (politician rows matching `official_count`, correct structure/mayor type/district-vs-at-large). Headshot gaps and thin-or-blank stance coverage are recorded as **documented acceptable gaps**, NOT blockers — consistent with prior-wave reality (100% headshot-source 403 walls; honest-blank no-default stance policy).
  - **D-03a (roster currency, added 2026-06-22):** The HARD roster check verifies each city's roster reflects **current post-June-2026 officeholders** (count + structure + mayor type + district-vs-at-large), since many Wave-2 cities reseated for June 2026 election turnover (e.g. Glendale Najarian→Bartrosouf, Burbank/Norwalk rotational mayor changes). Any seat whose post-election occupant is genuinely uncertain from free sources is logged as a **documented gap, NOT a close blocker** — matches structure-hard/data-soft.
- **D-04:** Audit content is DB-verified, per-city. Verify counts directly against the live Supabase DB (`mcp__supabase-local` IS production) — gov row, chamber, roster vs. official_count, headshot count, stance count — and record per-city verdict + gap notes.
  - **D-04a (wave gotchas baked into queries, added 2026-06-22):** Audit queries MUST explicitly account for the patterns surfaced across 142–156 so the audit doesn't silently miss defects: (a) `districts.government_id` is NULL — join districts via **geo_id**, not government_id; (b) reconcile-vs-greenfield cities (most of Wave 2 was reconcile) — verify the survivor chamber after duplicate-chamber merges/reseating, confirm no orphaned/inactive rows are miscounted; (c) confirm no wrong-person headshots slipped through (spot-check the known fixes — Glendale, West Covina Gutierrez, Pomona Gonzalez/Torres); (d) run the split-section detection query (see `feedback_section_split_check`) per city and record results.

### Audit doc format (Success criterion 3)
- **D-05:** Write a standalone `.planning/v17.0-MILESTONE-AUDIT.md` (root location, matching the 3 most recent milestones v16.0/v11.0/v10.0 — NOT the older `.planning/milestones/` subdir). Include a per-city DB-verified count table (gov / chamber / roster vs official_count / headshots / stances + gap notes), the structure-hard/data-soft verdict per city, and the deferred split-section follow-up.
- **D-06:** Then add the v17.0 "Shipped" summary entry to `.planning/MILESTONES.md` (follow the existing entry shape: Delivered / Phases completed / Key accomplishments / Stats / Git range / What's next) and flip status in `.planning/STATE.md` + `.planning/PROJECT.md`.

### LOCATION-ONBOARDING.md update (Success criterion 2)
- **D-07:** Add one "Cities Onboarded" table row per Wave-2 city (existing table format: City | State | Onboarded | Election method | Notable patterns) and capture any net-new LA-County-Wave-2 GOTCHAs surfaced across phases 142–156. Pull notable-pattern detail from each city's CONTEXT/STATE summaries. GOTCHAs MUST include the concrete patterns that recurred this wave: (a) reconcile-vs-greenfield default (most cities were already partially seeded — DB pre-check every city); (b) June 2026 election turnover requiring reseating; (c) duplicate-chamber merge/reseating; (d) `districts.government_id` NULL → link via geo_id; (e) wrong-person headshot pitfalls; (f) WAF-403 vs NO-WAF source patterns per city.

### Shared UI fixes made mid-wave (added 2026-06-22)
- **D-08:** Several Wave-2 phases touched **shared** UI components (notably Phase 156's fix to `src/lib/groupHierarchy.js` for Mayor > Mayor-Pro-Tem ordering + label, flagged "needs deploy"; plus Burbank-era display tweaks). The close-out **verifies these shared UI fixes are committed to main and records whether a production deploy is still pending** — as a **documented item in the v17.0 audit, NOT a close blocker, and NOT a deploy action performed by this phase**. This keeps the "surfaced cities render correctly" promise honest without expanding scope into deployment.

### Claude's Discretion
- Exact wording of GOTCHA entries and "Notable patterns" cells — synthesize from the per-city phase artifacts.
- Audit table column layout beyond the required DB-verified dimensions.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### This phase's spec
- `.planning/ROADMAP.md` §"Phase 157: Wave 2 close-out" — goal + 3 success criteria
- `.planning/REQUIREMENTS.md` — LAC2-RETRO-01 acceptance text

### Surfacing target
- `src/pages/Landing.jsx` — `COVERAGE_STATES` array; line ~9 documents `hasContext` semantics; CA block lines ~14–32 show the alphabetical entry format to extend

### Shared UI fix verification target (D-08)
- `src/lib/groupHierarchy.js` — Phase 156 Mayor > Mayor-Pro-Tem ordering+label fix lives here; confirm committed + flag deploy status in the audit (do not modify in this phase)

### Audit query helpers (D-04a)
- `feedback_section_split_check` (auto-memory) — split-section detection SQL to run per city; zero rows = clean

### Learnings target
- `LOCATION-ONBOARDING.md` — "Cities Onboarded" table (~line 25) + GOTCHA entries throughout; this is the playbook to update

### Milestone close targets + precedent
- `.planning/MILESTONES.md` — add v17.0 "Shipped" entry (follow existing entry shape)
- `.planning/v16.0-MILESTONE-AUDIT.md` — most recent audit; use as format/location precedent
- `.planning/STATE.md` / `.planning/PROJECT.md` — milestone status flip targets

### Per-city source artifacts (for audit + onboarding rows)
- `.planning/phases/142-*` through `.planning/phases/156-*` CONTEXT/STATE summaries — per-city geo_ids, rosters, ext_id ranges, headshot/stance counts, gotchas

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Landing.jsx` `COVERAGE_STATES` CA block: established alphabetical entry pattern `{ label, browseGovernmentList: ['<geo_id>'], browseStateAbbrev: 'CA', hasContext: true }`. Wave-2 cities are NOT yet present (current CA list ends at Whittier) — they get inserted into alphabetical order.
- `LOCATION-ONBOARDING.md` "Cities Onboarded" table: established 5-column row format with rich "Notable patterns" cells (see v15.0 LA-area rows for the pattern to mirror).

### Established Patterns
- `hasContext: true` = purple chip = compass stances seeded (Landing.jsx:9). Honored verbatim by D-02.
- Milestone audit = standalone `.planning/vX.0-MILESTONE-AUDIT.md` + MILESTONES.md "Shipped" entry + STATE/PROJECT status flip.
- DB is production: `mcp__supabase-local` writes/reads are live; audit queries are read-only verification.

### Integration Points
- Landing.jsx browse wiring routes through the by-government-list browse endpoint using geo_ids (same mechanism existing CA cities use).

</code_context>

<specifics>
## Specific Ideas

- Audit must distinguish a genuine structural defect (blocker) from an acceptable documented gap (headshot 403 walls, honest-blank stances) — phrase verdicts so a reader can tell "incomplete on purpose" from "broken."
- Purple chip applied from real DB stance counts, not from "we ran a stance phase" assumption — a phase can complete with 0 stances (honest blank).

</specifics>

<deferred>
## Deferred Ideas

- **Split-section defect cleanup (5 cities)** — Whittier (8), Compton (6), Carson (5), South El Monte (4), South Pasadena (3) have pre-existing split-section defects from prior phases (v7.0/v15.0), flagged OUT-OF-SCOPE in Phase 143. NOT fixed in 157. Record in the v17.0 audit's known-issues/follow-up section; candidate for its own dedicated cleanup phase in a future milestone. No data changes in this phase.

</deferred>

---

*Phase: 157-wave-2-close-out*
*Context gathered: 2026-06-19*
