# Phase 90: Post-Election Follow-up + MiniCompass UI - Context

**Gathered:** 2026-06-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Two parallel workstreams:

1. **Post-election DB updates** — Add ME June 9 primary winners to `race_candidates` (US Senate general, ME-01 general, ME-02 general); update lavote.gov `election_id` in `discovery_jurisdictions` for CA November 2026 general.

2. **MiniCompass visual polish** — Spoke labels must be truly invisible with no reserved whitespace; answer dots must be ~50% smaller (r≈2.5 vs current r=5). Tooltips must remain functional on all dots.

</domain>

<decisions>
## Implementation Decisions

### Timing — Phase 90 Execution

- **D-01:** Phase 90 execution WAITS until after ME June 9 primary (results typically known June 9 evening or June 10). Do not start execution before June 9.
- **D-02:** All four tasks (POST-ELECTION-01, POST-ELECTION-02, UI-01, UI-02) execute together in one phase after results are in.

### lavote Election ID (POST-ELECTION-02)

- **D-03:** The researcher must find the lavote.gov election ID for the CA November 4, 2026 general election. Check the LA County Socrata campaign finance API / lavote.gov discovery endpoint for the correct `election_id` value. Current value in `discovery_jurisdictions` is for the June 2026 cycle.

### MiniCompass UI — Order of Operations

- **D-04:** Step 1 is always `npm install` to get ev-ui 0.9.2 (published 2026-06-04) + visual test. PR #43 (ea(cards) compass card polished) may have already fixed label rendering and/or added `dotRadius` prop. If 0.9.2 fixes both UI-01 and UI-02, skip all further UI work.
- **D-05:** If 0.9.2 does NOT fix the issues, proceed with fallback changes below.

### MiniCompass Labels (UI-02) — Fallback

- **D-06:** The root cause is that `RadarChartCore` reserves `sidePadding=40px` on each side even when `labelFontSize={0}` — the padding calculation (`estimatedWidth × 0.55 + labelOffset`) bottoms out at `minPadding=40` regardless of font size. This eats chart space and causes the chart to appear smaller.
- **D-07:** Fallback fix in `MiniCompass.jsx`: pass `padding={0}` and `labelOffset={0}` to `RadarChartCore`. This reduces `minPadding` impact and shrinks `sidePadding`, giving the radar chart more of its container. Alternatively, if ev-ui 0.9.2 exposes a `showLabels={false}` prop that also zeros the padding path, use that instead.

### MiniCompass Dot Size (UI-01) — Fallback

- **D-08:** Dots are hardcoded in `RadarChartCore` at `r=5` (user dot) and `r=6` (match/yellow). No prop exists to override this. Correct fix: add a `dotRadius` prop to `RadarChartCore` in ev-ui (default `5`, MiniCompass passes `2.5`).
- **D-09:** We own ev-ui. The plan should include: clone/update ev-ui repo → add `dotRadius` prop to `RadarChartCore` → publish new patch release → `npm install` in essentials → pass `dotRadius={2.5}` from `MiniCompass.jsx`. Skip this if 0.9.2 already exposes `dotRadius`.
- **D-10:** Dot tooltips must remain functional. MiniCompass already maintains its own `dotPositions` array and portal tooltip — the ev-ui built-in SVG tooltip should remain suppressed by the transparent overlay div.

### Claude's Discretion

- Whether to combine the ev-ui label fix and dotRadius prop in one PR or ship them separately.
- Exact `dotRadius` value to pass — target is visually ~50% smaller than current; `2.5` is the starting point but `3` is acceptable if `2.5` looks too faint.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### MiniCompass Component
- `src/components/MiniCompass.jsx` — Full component; note `INNER_SVG_SIZE=200`, `labelFontSize={0}`, `padding={10}`, `labelOffset={8}` props passed to RadarChartCore; transparent overlay div suppresses built-in tooltip; `dotPositions` array mirrors RadarChartCore dot math
- `src/components/ElectionsView.jsx` — Uses MiniCompass at `size={190}` inside candidate tile overlay; see line ~744
- `src/pages/Results.jsx` — Uses MiniCompass at `size={190}` inside representative tile overlay; see line ~1334

### ev-ui Library
- `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` — Local source; `r=5/6` dot hardcoding at lines ~286-338; `sidePadding` calculation (minPadding=40) at lines ~127-131; no `dotRadius` prop in current source
- ev-ui npm package: `@empoweredvote/ev-ui` — current installed `0.8.14`, `package.json` requires `^0.9.1`, latest published `0.9.2` (2026-06-04, PR #43)

### Elections / DB
- `.planning/REQUIREMENTS.md` — POST-ELECTION-01/02, UI-01/02 requirements with acceptance criteria
- `discovery_jurisdictions` table — contains `election_id` column for lavote.gov CA row; researcher must identify correct November 2026 general election ID from lavote.gov or LA Socrata API

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MiniCompass.jsx:dotPositions` — already mirrors RadarChartCore dot math exactly; used for portal tooltips; safe to reuse if rendering own dot overlay becomes necessary
- `MiniCompass.jsx:HIT_RADIUS_SVG=20` — existing hit radius for dot hover; may need to adjust down if dots get smaller

### Established Patterns
- ev-ui changes: clone `C:/ev-ui/ev-ui-main`, edit, publish via npm/CI tag push (CI auto-publishes on tag — no OTP needed per project memory)
- DB migrations: next migration number is 268 (from STATE.md); SQL applied via `mcp__supabase-local__apply_migration`
- Headshot/migration pattern: previous post-election work has been SQL `INSERT INTO race_candidates` rows with known politician_ids and race_ids

### Integration Points
- `npm install` in `C:/Transparent Motivations/essentials` to pick up 0.9.2
- `discovery_jurisdictions` table in Supabase (remote/production) — treat all writes as live

</code_context>

<specifics>
## Specific Ideas

- User clarified "50% smaller" refers ONLY to the dot markers at each spoke inflection point — NOT the overall chart size or container.
- Labels are "way too small to read" and their reserved whitespace makes the chart unhelpfully small. Goal: zero label presence (invisible + zero space reserved).
- Each dot still needs a tooltip showing stance text — this is already handled by MiniCompass's own portal tooltip mechanism.
- The chart container itself (size={190}) should stay as-is; more of that space should be used by the actual radar chart once label padding is removed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 90-Post-Election Follow-up + MiniCompass UI*
*Context gathered: 2026-06-04*
