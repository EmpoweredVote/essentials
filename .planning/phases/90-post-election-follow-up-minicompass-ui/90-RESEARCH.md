# Phase 90: Post-Election Follow-up + MiniCompass UI - Research

**Researched:** 2026-06-04
**Domain:** DB migrations (race_candidates, discovery_jurisdictions) + ev-ui RadarChartCore UI patch
**Confidence:** HIGH (codebase verified) / MEDIUM (lavote November ID not yet published)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 90 execution WAITS until after ME June 9 primary (results typically known June 9 evening or June 10). Do not start execution before June 9.
- **D-02:** All four tasks (POST-ELECTION-01, POST-ELECTION-02, UI-01, UI-02) execute together in one phase after results are in.
- **D-03:** The researcher must find the lavote.gov election ID for the CA November 4, 2026 general election. Current value in `discovery_jurisdictions` is for the June 2026 cycle (id=4338).
- **D-04:** Step 1 is always `npm install` to get ev-ui 0.9.2 + visual test. If 0.9.2 fixes both UI-01 and UI-02, skip all further UI work.
- **D-05:** If 0.9.2 does NOT fix the issues, proceed with fallback changes below.
- **D-06:** Fallback for UI-02: root cause is `RadarChartCore` reserves `sidePadding=40px` on each side even when `labelFontSize={0}` — the `minPadding` floor of 40 does not respect zero font size.
- **D-07:** Fallback fix in `MiniCompass.jsx`: pass `padding={0}` and `labelOffset={0}` to `RadarChartCore`. Alternatively use `showLabels={false}` if 0.9.2 exposes it.
- **D-08:** Dots are hardcoded in `RadarChartCore` at `r=5` (user dot) and `r=6` (match/yellow). No prop exists to override this in current installed version.
- **D-09:** Correct fix: add a `dotRadius` prop to `RadarChartCore` in ev-ui (default `5`, MiniCompass passes `2.5`). Plan includes: update ev-ui repo → add `dotRadius` prop → publish new patch release → `npm install` in essentials → pass `dotRadius={2.5}` from `MiniCompass.jsx`. Skip if 0.9.2 already exposes `dotRadius`.
- **D-10:** Dot tooltips must remain functional. MiniCompass maintains its own `dotPositions` array and portal tooltip — the ev-ui built-in SVG tooltip should remain suppressed by the transparent overlay div.

### Claude's Discretion

- Whether to combine the ev-ui label fix and dotRadius prop in one PR or ship them separately.
- Exact `dotRadius` value to pass — target is visually ~50% smaller than current; `2.5` is the starting point but `3` is acceptable if `2.5` looks too faint.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| POST-ELECTION-01 | ME June 9 primary winners added to US Senate general + ME-01 general + ME-02 general race_candidates rows | Migration 268 INSERT INTO race_candidates; race IDs must be queried from DB at execution time |
| POST-ELECTION-02 | lavote.gov election ID updated in discovery_jurisdictions for CA November general | UPDATE discovery_jurisdictions SET source_url; November 2026 ID not yet published by lavote.gov — requires live check at execution time |
| UI-01 | MiniCompass chart circles reduced by ~50% (dots only — r≈2.5 vs current r=7/8 in 0.9.2) | Check 0.9.2 first (has `showLabels` but NOT `dotRadius`); add `dotRadius` prop to RadarChartCore in ev-ui if needed |
| UI-02 | Titles/labels removed from around MiniCompass (no spoke labels, no reserved whitespace) | 0.9.2 has `showLabels={false}` which sets `minPadding=10` (vs 40); this directly solves UI-02 |
</phase_requirements>

---

## Summary

Phase 90 has two parallel workstreams with no dependencies between them.

**Workstream A (DB)** adds Maine June 9 primary winners to three general race rows in `race_candidates`, and updates the lavote.gov `source_url` in `discovery_jurisdictions` for the CA November 2026 cycle. The ME work is purely SQL: query the race IDs for the US Senate general, ME-01 general, and ME-02 general races from the live DB, then INSERT race_candidates rows for each D-primary winner once results are certified. The lavote work requires finding the election_id that lavote.gov will assign to the November 3, 2026 General Election — this ID is not yet published as of 2026-06-04 and must be checked live at execution time.

**Workstream B (UI)** fixes MiniCompass visual presentation. The key research finding is that ev-ui 0.9.2 (published 2026-06-04) adds a `showLabels` prop to `RadarChartCore` that zeros label padding (`minPadding=10` when `showLabels=false`, vs 40 previously). This directly solves UI-02. However, 0.9.2 did NOT add a `dotRadius` prop — dots are still hardcoded at `r=7`/`r=8` (changed from `r=5`/`r=6` in 0.8.x). The dot size issue (UI-01) requires adding `dotRadius` to ev-ui source and publishing a new patch.

**Primary recommendation:** Plan 90-01 covers UI work (install 0.9.2, verify `showLabels` fixes UI-02, then add `dotRadius` prop to ev-ui and republish). Plan 90-02 executes after June 9 and covers ME race_candidates + lavote ID update in a single migration 268.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| ME primary winner insertion | Database / Storage | — | Pure SQL migration; no frontend change needed |
| lavote election ID update | Database / Storage | — | UPDATE to discovery_jurisdictions; backend reads it at cron time |
| MiniCompass dot sizing | Frontend (Browser) | ev-ui library | r prop on SVG circle elements; requires library source change |
| MiniCompass label suppression | Frontend (Browser) | ev-ui library | showLabels prop controls padding path in RadarChartCore |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @empoweredvote/ev-ui | 0.9.2 | RadarChartCore component | Project-owned library; 0.9.2 adds showLabels prop |
| mcp__supabase-local | — | DB migrations via apply_migration | Established pattern; mcp__supabase-local IS production |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React createPortal | (built-in) | MiniCompass tooltip overlay | Already in use; no change needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ev-ui dotRadius prop | CSS scale() transform on dots | Scale() would also affect stroke width; prop is cleaner |
| ev-ui dotRadius prop | MiniCompass renders own dot layer on top | More complex; existing overlay div already suppresses ev-ui tooltip |

---

## Package Legitimacy Audit

No new external packages are being installed in this phase. ev-ui 0.9.2 is the project's own scoped npm package (`@empoweredvote/ev-ui`), owned and published by the EmpoweredVote organization.

**Packages removed due to slopcheck verdict:** none
**Packages flagged as suspicious:** none

---

## Architecture Patterns

### System Architecture Diagram

```
POST-ELECTION workstream:
  ME Primary Results (June 9 evening)
    → Query race IDs (essentials.races WHERE election.state='23' AND type=NATIONAL_UPPER/NATIONAL_LOWER)
    → INSERT race_candidates (winner politician_id + race_id)
    → Migration 268 applied via mcp__supabase-local__apply_migration

  lavote November ID (check live at execution time)
    → Probe lavote.gov/Apps/CandidateList/Index for November 2026 listing
    → If found: UPDATE discovery_jurisdictions SET source_url='...?id=XXXX'
    → If not found: UPDATE deferred (document in SUMMARY)

UI workstream:
  npm install @empoweredvote/ev-ui@latest (gets 0.9.2)
    → Visual test: does MiniCompass look correct?
      → showLabels fix: YES (0.9.2 has showLabels prop)
      → dotRadius fix: NO (0.9.2 still hardcodes r=7/8)
    → MiniCompass.jsx: add showLabels={false} prop
    → ev-ui: update RadarChartCore to accept dotRadius prop
    → ev-ui: publish patch (0.9.3 or 0.10.0)
    → npm install new version in essentials
    → MiniCompass.jsx: add dotRadius={2.5} prop
```

### Recommended Project Structure

No new directories. All changes are in-place:
```
src/components/MiniCompass.jsx         # add showLabels={false} and dotRadius={2.5} props
C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx  # add dotRadius prop (default=5)
supabase/migrations/268_*.sql          # ME race_candidates + lavote update
```

### Pattern 1: race_candidates INSERT

**What:** Add primary winner as a candidate in the general election race
**When to use:** After primary results are certified; race IDs must be looked up first

```sql
-- Source: v6.0-ROADMAP.md pattern (migration 183); race IDs are runtime values
INSERT INTO essentials.race_candidates (race_id, politician_id, candidate_status, is_incumbent)
VALUES (
  (SELECT r.id FROM essentials.races r
   JOIN essentials.elections e ON e.id = r.election_id
   WHERE e.state = '23' AND e.election_date = '2026-11-03'
     AND r.position_name = 'U.S. Senator' AND r.primary_party IS NULL
   LIMIT 1),
  '<winner_politician_id>',
  'filed',
  false
)
ON CONFLICT (race_id, politician_id) DO NOTHING;
```

### Pattern 2: RadarChartCore showLabels prop (verified in 0.9.2)

**What:** Pass `showLabels={false}` to suppress labels AND zero out the padding reservation
**When to use:** Always in MiniCompass context

```jsx
// Source: verified in @empoweredvote/ev-ui@0.9.2 dist/index.mjs lines 48, 116, 129
// showLabels=false sets minPadding=10 (down from 40) and skips label elements entirely
<RadarChartCore
  ...
  showLabels={false}   // NEW — replaces labelFontSize={0} + padding workaround
  tightFit={true}
  ringColor="transparent"
  darkMode={!!isDark}
/>
```

### Pattern 3: dotRadius prop (to be added to ev-ui)

**What:** Add `dotRadius` prop to `RadarChartCore`; default `5` to preserve existing behavior; MiniCompass passes `2.5`
**When to use:** When shrinking dots in compact contexts

```jsx
// Source: ev-ui local source C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx
// Current hardcoded values (lines 286-338):
//   r: matches ? 6 : 5  (0.8.x), r: matches ? 8 : 7 (0.9.2)
// Target prop addition:
export default function RadarChartCore({
  ...
  dotRadius = 5,   // ADD this prop
}) {
  // Then use: r={matches ? dotRadius * 1.2 : dotRadius}
  // (or simply r={dotRadius} for match dots too — discretion of planner)
}
```

### Anti-Patterns to Avoid

- **Setting `labelFontSize={0}` only:** Does NOT eliminate padding — `minPadding=40` floor applies regardless of font size in 0.8.x. Use `showLabels={false}` in 0.9.2 instead.
- **Hardcoding race IDs in migration:** Race UUIDs are auto-generated and environment-specific. Always use subquery by election_date + state + position_name.
- **Using npm install before ev-ui changes are published:** The `dotRadius` prop doesn't exist yet — install 0.9.2 first to get `showLabels`, then add `dotRadius` and publish the next version.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dot size control | Custom dot overlay rendering | dotRadius prop in RadarChartCore | MiniCompass already mirrors dot positions — adding another layer doubles positioning complexity |
| Label suppression | CSS visibility:hidden on label elements | showLabels={false} prop | CSS only hides; padding still reserves space |
| ME candidate lookup | Scraping SOS website during migration | Query live DB for politician_ids | ME politicians already seeded (Collins ext=-230101, King ext=-230102, Pingree, Golden); D-primary winners need new politician rows if not yet seeded |

**Key insight:** ev-ui 0.9.2's `showLabels` prop is the authoritative fix for UI-02. The padding reservation is a rendering concern, not a styling concern — only a prop change to the calculation path eliminates it.

---

## Common Pitfalls

### Pitfall 1: lavote November 2026 ID Not Yet Published

**What goes wrong:** Attempt to find election_id for CA November 3, 2026 general on lavote.gov and discover it doesn't exist yet in any dropdown or API endpoint.
**Why it happens:** lavote.gov only populates the candidate list for elections within the current filing window. November 2026 candidates haven't filed yet; the election has no ID in the system.
**How to avoid:** At execution time (post-June-9), probe `https://www.lavote.gov/Apps/CandidateList/Index` for all listed elections. If November 2026 appears, extract the `?id=XXXX` value and apply the UPDATE. If it doesn't appear yet, document the attempt in the SUMMARY and flag for a follow-up micro-task when the ID becomes available.
**Warning signs:** The dropdown on lavote.gov/Apps/CandidateList/Index shows only elections through August 2026 — November 2026 not yet listed.

### Pitfall 2: ME Primary Winners May Need New politician Rows

**What goes wrong:** INSERT into race_candidates fails or links to wrong person because the D-primary winner isn't yet in the `politicians` table.
**Why it happens:** Only declared incumbents and known pre-primary candidates are seeded. Primary winners (especially in competitive D primaries) may be previously unknown.
**How to avoid:** At execution time, query `SELECT * FROM essentials.politicians WHERE full_name ILIKE '%<winner_name>%'`. If not found, INSERT a new politician row first, then INSERT race_candidates. Use the next available external_id in the ME range (-230xxx).
**Warning signs:** race_candidates INSERT returns foreign key error on politician_id.

### Pitfall 3: 0.9.2 Dots Are LARGER Than 0.8.14

**What goes wrong:** After npm install gets 0.9.2, dots appear LARGER than before (r=7/8 vs old r=5/6), making UI-01 worse not better.
**Why it happens:** PR #43 (compass card polished) increased dot sizes as part of the cards UI polish. The MiniCompass context did not benefit from this.
**How to avoid:** The planner must account for this: after `npm install`, verify the visual result. The `dotRadius` prop addition needs to use a value relative to the new 0.9.2 baseline. Target `r≈3.5` (half of 7) rather than `r≈2.5` (half of 5) — OR pass `dotRadius={2.5}` if the prop is defined as the smaller variant size directly. Planner discretion.
**Warning signs:** First visual test after npm install shows dots larger than before.

### Pitfall 4: Confusing race_candidates with candidate_staging

**What goes wrong:** Confusion about whether to use the discovery staging queue vs direct SQL insert for primary winners.
**Why it happens:** The discovery pipeline routes through candidate_staging; manual seeding of known winners bypasses it.
**How to avoid:** Primary winners are known, verified facts — they go directly to `race_candidates` via migration, NOT through candidate_staging. The staging table is for discovered candidates from automated web scraping.

### Pitfall 5: ev-ui local source is out of date with npm published

**What goes wrong:** `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` shows version 0.8.12 in package.json but npm has 0.9.2. Local source does NOT reflect published state.
**Why it happens:** The local clone has no git remote tracking (Bash confirmed: "no git in local clone"). Changes from PR #43 that produced 0.9.x are not in the local source.
**How to avoid:** The planner must include a step to re-clone or pull the ev-ui repo before editing. The local `C:/ev-ui/ev-ui-main/` directory has package.json showing 0.8.12 — it is stale. Do NOT add `dotRadius` to the local 0.8.12 source and publish from there — that would roll back the 0.9.2 `showLabels` improvements. Must update local source to 0.9.2 first.
**Warning signs:** `cat C:/ev-ui/ev-ui-main/package.json | grep version` shows `0.8.12`.

---

## Code Examples

### Current MiniCompass.jsx RadarChartCore call (verified)

```jsx
// Source: C:/Transparent Motivations/essentials/src/components/MiniCompass.jsx lines 152-169
// Current (0.8.14 installed, before Phase 90):
<RadarChartCore
  topics={topicsFiltered}
  data={userData}
  compareData={polData}
  invertedSpokes={invertedSpokes || {}}
  replacedSpokes={{}}
  boldOriginalSpokes={false}
  onToggleInversion={() => {}}
  onReplaceTopic={() => {}}
  size={INNER_SVG_SIZE}       // 200
  labelFontSize={0}           // currently zero but padding still 40
  maxLabelLines={3}
  padding={10}                // NOT zero; should become 0 for minPadding relief
  labelOffset={8}             // NOT zero; should become 0
  tightFit={true}
  ringColor="transparent"
  darkMode={!!isDark}
/>
```

### Target MiniCompass.jsx RadarChartCore call (after UI-01 + UI-02)

```jsx
// After npm install 0.9.2 + ev-ui dotRadius patch published:
<RadarChartCore
  topics={topicsFiltered}
  data={userData}
  compareData={polData}
  invertedSpokes={invertedSpokes || {}}
  replacedSpokes={{}}
  boldOriginalSpokes={false}
  onToggleInversion={() => {}}
  onReplaceTopic={() => {}}
  size={INNER_SVG_SIZE}       // 200 (unchanged)
  showLabels={false}          // NEW — replaces labelFontSize+padding workaround
  tightFit={true}
  ringColor="transparent"
  darkMode={!!isDark}
  dotRadius={2.5}             // NEW — requires ev-ui patch; ~50% smaller than r=7
/>
```

### showLabels effect in 0.9.2 (verified from dist)

```js
// Source: @empoweredvote/ev-ui@0.9.2 dist/index.mjs lines 116, 129, 160
// With showLabels=false:
//   labelMeta returns { estimatedWidth: 0, side } for every spoke
//   minPadding = 10  (was 40 with showLabels=true)
//   labelMargin in tightFit = 8  (was labelOffset + fontSize * maxLines)
//   label elements are not rendered (showLabels && spokes.map(...))
```

### Verified 0.9.2 dot sizes (pitfall: larger than 0.8.x)

```js
// Source: @empoweredvote/ev-ui@0.9.2 dist/index.mjs lines 279, 317
// User dot: r: matches ? 8 : 7   (was r: matches ? 6 : 5 in 0.8.x)
// Compare dot: r: matches ? 8 : 7
// dotRadius prop: NOT present in 0.9.2
```

---

## ev-ui Workstream: Order of Operations

This is the most complex dependency chain in the phase. The planner must sequence these steps correctly:

1. `npm install` in `C:/Transparent Motivations/essentials` — installs 0.9.2
2. Add `showLabels={false}` to `MiniCompass.jsx` — fixes UI-02 immediately
3. Visual test with 0.9.2 — confirms label padding removed; dots are NOW r=7/8 (larger than before)
4. Update local ev-ui source to 0.9.2 codebase (re-clone or pull from GitHub)
5. Add `dotRadius` prop to `RadarChartCore` in local ev-ui source
6. Build and publish as new patch version (0.9.3 or 0.9.x)
7. `npm install @empoweredvote/ev-ui@latest` in essentials
8. Add `dotRadius={2.5}` to `MiniCompass.jsx`
9. Visual test — confirm dots are ~50% smaller than r=7 baseline

**Decision point for planner:** Steps 2+5 can be combined into one ev-ui PR if the planner wants to ship both fixes in a single 0.9.3 release. The `showLabels={false}` change in MiniCompass.jsx can wait until the 0.9.3 package is installed, avoiding an intermediate state where `showLabels` exists but `dotRadius` doesn't. Or they can be shipped in sequence (0.9.2 for labels, 0.9.3 for dots). Either approach is valid — this is Claude's discretion per D-02 notes.

---

## lavote Election ID: Research Findings

**Finding:** The CA November 3, 2026 General Election does NOT yet have an assigned election ID on lavote.gov as of 2026-06-04. [VERIFIED: direct probe of lavote.gov/Apps/CandidateList/Index]

The dropdown on the CandidateList page lists these elections (as of 2026-06-04):
- STATEWIDE DIRECT PRIMARY ELECTION - 6/2/2026 (id=4338) ← current DB value
- LOCAL AND MUNICIPAL ELECTIONS - 11/4/2025
- GENERAL ELECTION - 11/5/2024
- No November 2026 entry visible

**What this means for the plan:** POST-ELECTION-02 cannot be fully executed until lavote.gov publishes the November 2026 election ID. The plan should include a live probe step. If the ID is available at execution time, apply the UPDATE. If not, document and schedule a follow-up.

**Numeric pattern:** Previous IDs suggest sequential assignment (4338 = June 2026). The November 2026 ID is likely 4339 or higher, but this is [ASSUMED] — do not hardcode without verification from the lavote CandidateList dropdown.

---

## ME Primary Context

### Known ME Races Needing Winners

From v6.0 roadmap (migration 183):

| Race | Type | Current State | Notes |
|------|------|--------------|-------|
| US Senate General 2026 | NATIONAL_UPPER | Collins (R, incumbent) + 2 challengers (Platner, Costello) seeded | Need D primary winner |
| ME-01 General 2026 | NATIONAL_LOWER, geo_id=2301 | Pingree (D, incumbent, linked) + 2 R challengers seeded | ME-01 is D safe — Pingree likely D candidate; confirm she ran |
| ME-02 General 2026 | NATIONAL_LOWER, geo_id=2302 | 4D + 1R seeded (Golden not running — open seat) | Need D primary winner (4-way D primary) |

**Note on ME-01:** Chellie Pingree is the incumbent; if she ran uncontested in the D primary, she may already be in race_candidates. Verify before inserting duplicate.

### Known politician IDs (from v6.0 milestone audit)

- Susan Collins: external_id = -230101 [CITED: v6.0-ROADMAP.md migration 170]
- Angus King: external_id = -230102 [CITED: v6.0-ROADMAP.md migration 170]
- Chellie Pingree (ME-01): politician_id linked in Phase 51 migration [CITED: v6.0-MILESTONE-AUDIT.md MGOV-05]
- Jared Golden (ME-02): politician_id linked in Phase 51 migration; NOT running in 2026 [CITED: v6.0-ROADMAP.md]

**For D primary winners:** Their politician_ids must be verified in the live DB at execution time. If not seeded, use next available external_id in the ME range (-23xxxx).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| labelFontSize={0} to hide labels | showLabels={false} to zero padding too | 0.9.2 (2026-06-04) | Labels truly gone including reserved space |
| r=5/6 hardcoded dots | r=7/8 hardcoded (0.9.2); dotRadius prop (planned 0.9.3) | 0.9.2 increased size; 0.9.3 will add control | Dots got bigger in 0.9.2; need prop to shrink |
| Manual migration number tracking | Always query STATE.md for `Next migration: N` | Ongoing | Migration 268 is next; verify before writing |

**Deprecated/outdated:**
- `padding={10}` + `labelOffset={8}` in MiniCompass: The real knob is `showLabels={false}` in 0.9.2.
- Comment `paddingRight: 14, // nudge compass left so the widest axis label clears the card edge` in ElectionsView + Results: After `showLabels={false}`, labels no longer exist so this nudge may be unnecessary. The planner may want to verify this visually.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | November 2026 lavote election ID is not yet published and will follow sequential numbering above 4338 | lavote Election ID section | Low — planner must probe live at execution time regardless |
| A2 | ME-01 Pingree is already seeded as a race_candidates row (incumbent, uncontested D primary) | ME Primary Context | Medium — if duplicate INSERT attempted, ON CONFLICT DO NOTHING handles it safely |
| A3 | D-primary winners for US Senate and ME-02 general are not yet in politicians table | ME Primary Context | Medium — if already seeded by prior agent work, existing politician_id should be used |
| A4 | ev-ui local clone at C:/ev-ui/ev-ui-main is at 0.8.12 and must be updated before editing | ev-ui Workstream | HIGH — if planner edits local source without updating first, publishes rolled-back code |
| A5 | dotRadius={2.5} achieves visual ~50% reduction from r=7 baseline | Code Examples | Low — 3.0 is acceptable fallback per D-09 |

---

## Open Questions

1. **What is the lavote November 2026 election_id?**
   - What we know: June 2026 is id=4338. November 2026 is scheduled November 3, 2026.
   - What's unclear: lavote.gov has not published this ID yet (as of 2026-06-04). It will appear in the CandidateList dropdown once candidate filing opens for the November cycle.
   - Recommendation: Planner includes live probe step at execution time. If not found, document and defer the UPDATE to a micro-task.

2. **Are ME-01 and ME-02 D-primary winners already politician rows in the DB?**
   - What we know: Phase 55 migration 183 seeded some candidates. v6.0 roadmap confirms 4D+1R for ME-02 (open seat). Pingree is the ME-01 incumbent.
   - What's unclear: Whether the specific June 9 primary winners are among those already seeded.
   - Recommendation: Execution agent queries `SELECT full_name, id FROM essentials.politicians WHERE external_id BETWEEN -2300100 AND -2399999` to see what ME politicians exist before writing the migration.

3. **Should MiniCompass drop the paddingRight:14 nudge after showLabels={false}?**
   - What we know: The comment explicitly says it nudges to clear "the widest axis label." With showLabels={false}, no labels exist.
   - What's unclear: Whether removing the nudge improves or worsens the visual alignment of the compass within the candidate tile.
   - Recommendation: Planner tests both with and without the nudge after 0.9.2 install, then decides.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| npm | ev-ui publish + essentials install | Yes | (system npm) | — |
| @empoweredvote/ev-ui@0.9.2 | UI-01/UI-02 | Published on npm | 0.9.2 | — |
| mcp__supabase-local | DB migrations | Yes (per project memory) | — | — |
| C:/ev-ui/ev-ui-main | dotRadius prop addition | Present but stale (0.8.12) | 0.8.12 local | Must update before editing |
| lavote.gov CandidateList | POST-ELECTION-02 | Accessible | — | Defer UPDATE if ID not published |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** lavote November 2026 ID — defer UPDATE if not available at execution time.

---

## Validation Architecture

nyquist_validation not explicitly set to false in config.json — treat as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Visual / manual (no automated test suite detected for UI; DB migrations verified via SQL queries) |
| Config file | none — see Wave 0 |
| Quick run command | Visual check in browser after each UI change |
| Full suite command | `npm run dev` → navigate to /elections or /results with compass active |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POST-ELECTION-01 | ME winners in race_candidates | SQL query | `SELECT COUNT(*) FROM essentials.race_candidates rc JOIN essentials.races r ON rc.race_id = r.id JOIN essentials.elections e ON r.election_id = e.id WHERE e.state='23' AND e.election_date='2026-11-03'` | ✅ (via mcp__supabase-local) |
| POST-ELECTION-02 | lavote source_url updated | SQL query | `SELECT source_url FROM essentials.discovery_jurisdictions WHERE source_url LIKE '%lavote%'` | ✅ (via mcp__supabase-local) |
| UI-01 | Dots visually ~50% smaller | manual | Visual inspection in browser — hover candidate tile | ❌ Wave 0 (manual only) |
| UI-02 | No labels/titles visible, no whitespace reserved | manual | Visual inspection in browser — MiniCompass fits in tile without overflow | ❌ Wave 0 (manual only) |

### Wave 0 Gaps

- UI-01 and UI-02 are visual requirements — no automated test can verify them. Human UAT is the gate.

---

## Security Domain

This phase makes no auth, session, or access control changes. No ASVS categories apply. The DB updates use parameterized SQL via the Supabase migration tool.

---

## Sources

### Primary (HIGH confidence)

- `C:/Transparent Motivations/essentials/src/components/MiniCompass.jsx` — full component source; verified `INNER_SVG_SIZE=200`, `padding={10}`, `labelOffset={8}`, `labelFontSize={0}`, `tightFit={true}` passed to RadarChartCore
- `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` — local source at 0.8.12; `minPadding=40` at line 127; dots at `r=5`/`r=6` at lines 286-338; no `dotRadius` prop
- `/tmp/package/dist/index.mjs` — @empoweredvote/ev-ui@0.9.2 unpacked dist; `showLabels` prop with `minPadding=10` when false (line 129); dots at `r=7`/`r=8` (lines 280, 318); no `dotRadius` prop
- `npm view @empoweredvote/ev-ui version` — confirmed 0.9.2 is latest (published 2026-06-04)
- `https://www.lavote.gov/Apps/CandidateList/Index` — confirmed November 2026 not yet listed; June 2026 shows id=4338
- `.planning/milestones/v6.0-MILESTONE-AUDIT.md` — ME race structure; Collins/King/Pingree/Golden politician IDs; migration 183 content

### Secondary (MEDIUM confidence)

- `.planning/milestones/v6.0-ROADMAP.md` — ME race candidate counts (US Senate: Collins+Platner+Costello; ME-01: Pingree+2R; ME-02: 4D+1R)
- `90-CONTEXT.md` D-06/D-07/D-08/D-09 — user-confirmed root cause analysis for both UI issues

### Tertiary (LOW confidence)

- Lavote November 2026 election ID will be sequential above 4338 — [ASSUMED], needs live verification

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm view and dist inspection
- Architecture: HIGH — verified from live source files
- Pitfalls: HIGH — confirmed from reading compiled 0.9.2 dist (dot size increase is a concrete finding)
- lavote November ID: MEDIUM — known unavailability confirmed; future ID value is LOW

**Research date:** 2026-06-04
**Valid until:** 2026-06-16 (10 days — fast-moving; lavote ID may become available; ME primary results change POST-ELECTION-01 content)
