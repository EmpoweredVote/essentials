# Phase 90: Post-Election Follow-up + MiniCompass UI - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 4 (3 modified, 1 new)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `supabase/migrations/268_me_winners_lavote_update.sql` | migration | batch | `supabase/migrations/197_ca_governor_challengers.sql` + `supabase/migrations/241_or_discovery_jurisdictions.sql` | role-match |
| `src/components/MiniCompass.jsx` | component | request-response | self (modify in-place) | exact |
| `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` | component | request-response | self (add `dotRadius` prop) | exact |

---

## Pattern Assignments

### `supabase/migrations/268_*.sql` (migration, batch)

**Analog A — race_candidates INSERT pattern:**
Template `C:/Transparent Motivations/essentials/.planning/templates/elections-seed.md` lines 86-99

**Critical gotcha from template (line 87-88):**
```sql
-- [GOTCHA] race_candidates has NO unique constraint on (race_id, full_name)
-- Always use WHERE NOT EXISTS — ON CONFLICT DO NOTHING is a no-op without a unique constraint
INSERT INTO essentials.race_candidates (id, race_id, full_name, politician_id, is_incumbent)
SELECT
  gen_random_uuid(),
  '[race_uuid]',
  '[Candidate Full Name]',
  '[politician_uuid or NULL]',
  [true|false]
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates
  WHERE race_id = '[race_uuid]' AND full_name = '[Candidate Full Name]'
);
```

**Race ID lookup subquery pattern** (from RESEARCH.md Pattern 1):
```sql
-- NEVER hardcode race UUIDs — always look up by election attributes
-- race_id subquery for US Senate general (ME state FIPS = '23'):
(SELECT r.id FROM essentials.races r
 JOIN essentials.elections e ON e.id = r.election_id
 WHERE e.state = '23' AND e.election_date = '2026-11-03'
   AND r.position_name = 'U.S. Senator' AND r.primary_party IS NULL
 LIMIT 1)
-- Same pattern for ME-01/ME-02: change position_name to 'U.S. Representative District 1' / 'District 2'
```

**Politician pre-check pattern** (from template + RESEARCH.md Pitfall 2):
```sql
-- Query before writing migration to detect whether winner is already seeded:
SELECT id, full_name, external_id
FROM essentials.politicians
WHERE external_id BETWEEN -2300100 AND -2399999
ORDER BY external_id;
-- If winner NOT found, INSERT politician first with next -23xxxx external_id,
-- then reference that id in race_candidates INSERT.
```

**Analog B — discovery_jurisdictions UPDATE pattern:**
`supabase/migrations/197_ca_governor_challengers.sql` lines 96-107

```sql
-- Pattern: UPDATE source_url for existing lavote.gov row after new election ID is known
-- Current row: jurisdiction_geoid='06037', election_date='2026-06-03', source_url ending ?id=4338
UPDATE essentials.discovery_jurisdictions
SET source_url = 'https://www.lavote.gov/Apps/CandidateList/Index?id=XXXX',
    election_date = '2026-11-03'
WHERE jurisdiction_geoid = '06037'
  AND source_url LIKE '%lavote.gov%';
-- CONDITIONAL: Only apply if November 2026 ID is available from lavote.gov at execution time.
-- If not found: document the attempt and defer — do not hardcode an assumed ID.
```

**Analog C — idempotent INSERT with WHERE NOT EXISTS (most recent pattern):**
`supabase/migrations/241_or_discovery_jurisdictions.sql` lines 3-14

```sql
INSERT INTO essentials.discovery_jurisdictions (...)
SELECT gen_random_uuid(), ...
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.discovery_jurisdictions
  WHERE jurisdiction_geoid = '...' AND election_date = '...'
);
```

**Migration header convention** (from migration 241, lines 1-3):
```sql
-- Migration 268: ME June 9 primary winners + lavote November 2026 election ID update
-- Phase 90 Plan 02: POST-ELECTION-01 (race_candidates) + POST-ELECTION-02 (discovery_jurisdictions)
-- Applied: [date]
```

---

### `src/components/MiniCompass.jsx` (component, request-response)

**Analog:** Self — modify in-place. Full source at lines 1-202.

**Current RadarChartCore call site** (lines 152-169) — this is the block being changed:
```jsx
<RadarChartCore
  topics={topicsFiltered}
  data={userData}
  compareData={polData}
  invertedSpokes={invertedSpokes || {}}
  replacedSpokes={{}}
  boldOriginalSpokes={false}
  onToggleInversion={() => {}}
  onReplaceTopic={() => {}}
  size={INNER_SVG_SIZE}       // 200 — unchanged
  labelFontSize={0}           // REMOVE — superseded by showLabels={false}
  maxLabelLines={3}           // REMOVE — no longer relevant when showLabels=false
  padding={10}                // REMOVE — no longer needed; showLabels handles padding
  labelOffset={8}             // REMOVE — no longer needed
  tightFit={true}             // KEEP
  ringColor="transparent"     // KEEP
  darkMode={!!isDark}         // KEEP
/>
```

**Target RadarChartCore call** (after 0.9.2 install + ev-ui dotRadius patch):
```jsx
<RadarChartCore
  topics={topicsFiltered}
  data={userData}
  compareData={polData}
  invertedSpokes={invertedSpokes || {}}
  replacedSpokes={{}}
  boldOriginalSpokes={false}
  onToggleInversion={() => {}}
  onReplaceTopic={() => {}}
  size={INNER_SVG_SIZE}       // 200 — unchanged
  showLabels={false}          // UI-02 fix: zeros minPadding to 10 (vs 40), hides label elements
  tightFit={true}
  ringColor="transparent"
  darkMode={!!isDark}
  dotRadius={2.5}             // UI-01 fix: requires ev-ui 0.9.3+ with dotRadius prop
/>
```

**Transparent overlay div** (lines 170-175) — keep unchanged:
```jsx
{/* Transparent overlay captures mouse events — suppresses built-in RadarChartCore SVG tooltip */}
<div
  style={{ position: 'absolute', inset: 0, zIndex: 10 }}
  onMouseMove={handleMouseMove}
  onMouseLeave={() => setTooltip(null)}
/>
```

**RADAR_RADIUS constant** (line 9) — mirrors RadarChartCore internals for dotPositions math:
```jsx
const RADAR_RADIUS = INNER_SVG_SIZE / 2 - 40; // 60
```
Note: This hardcodes the `radius = size/2 - 40` formula from RadarChartCore (local 0.8.12 line 28).
If RadarChartCore's internal radius calculation changes in 0.9.x, dotPositions will drift.
Verify visually after upgrade — tooltip hit zones should still center on dots.

**Container wrapper** (lines 136-149) — keep unchanged:
```jsx
<div
  className="mini-compass-host"
  ref={containerRef}
  style={{
    width: size,
    height: size,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: containerOpacity,
    position: 'relative',
  }}
  aria-label="Mini compass"
>
```

---

### `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` (component, request-response)

**Analog:** Self — add `dotRadius` prop to existing component (currently at stale 0.8.12; must update to 0.9.2 codebase first).

**Current dot rendering** (local 0.8.12, lines 283-292 and 331-341) — this is the target:
```jsx
// User dot:
<circle
  key={`user-dot-${i}`}
  cx={cx} cy={cy}
  r={matches ? 6 : 5}          // ← hardcoded; 0.9.2 uses r=8/r=7
  fill={matches ? "#fed12e" : "#7C6B9E"}
  stroke="#FFFFFF"
  strokeWidth={2}
  style={{ pointerEvents: "none" }}
/>
// Compare dot:
<circle
  key={`compare-dot-${i}`}
  cx={cx} cy={cy}
  r={matches ? 6 : 5}          // ← hardcoded; 0.9.2 uses r=8/r=7
  fill={matches ? "#fed12e" : (darkMode ? "#6DD28C" : "#5A9A6E")}
  stroke="#FFFFFF"
  strokeWidth={2}
  style={{ pointerEvents: "none" }}
/>
```

**Props signature** (local 0.8.12, lines 4-27) — add `dotRadius` here:
```jsx
export default function RadarChartCore({
  topics,
  data,
  compareData = {},
  invertedSpokes = {},
  // ... other existing props ...
  labelFontSize = 13,
  padding = 80,
  labelOffset = 52,
  tightFit = false,
  darkMode = false,
  // ADD THIS:
  dotRadius = 5,   // default=5 preserves existing behavior; MiniCompass passes 2.5
}) {
```

**Target dot rendering after prop addition:**
```jsx
// User dot (replace hardcoded r with prop):
r={matches ? dotRadius * 1.14 : dotRadius}
// Compare dot (same):
r={matches ? dotRadius * 1.14 : dotRadius}
// Note: 1.14 ≈ 8/7 ratio from 0.9.2 matched/unmatched sizing
// Planner discretion: can use r={dotRadius} for both to keep it simple
```

**Prop prop signature for `showLabels`** (to be verified in 0.9.2 updated source):
```jsx
// From @empoweredvote/ev-ui@0.9.2 dist/index.mjs lines 116, 129:
// showLabels=false → minPadding=10 (was 40), no label elements rendered
// If 0.9.2 source uses: showLabels = true  (default)
// Then minPadding = showLabels ? 40 : 10
```

**CI publish workflow** (`C:/ev-ui/ev-ui-main/.github/workflows/publish.yml` lines 5-8):
```yaml
on:
  push:
    tags:
      - 'v*.*.*'
```
Steps to publish:
1. Edit `C:/ev-ui/ev-ui-main/package.json` → bump version from `0.9.2` to `0.9.3`
2. Edit `RadarChartCore.jsx` → add `dotRadius` prop
3. Commit + push tag `v0.9.3` → CI auto-publishes to npm, no OTP needed

**CRITICAL pitfall — stale local source** (RESEARCH.md Pitfall 5):
- `C:/ev-ui/ev-ui-main/package.json` shows `"version": "0.8.12"` — LOCAL IS STALE
- Do NOT edit local source and publish from stale 0.8.12 — would roll back `showLabels` and all 0.9.x improvements
- Must first: `git pull` or re-clone from `https://github.com/EmpoweredVote/ev-ui.git` to get 0.9.2 source, then add `dotRadius`

---

## Shared Patterns

### Migration Idempotency
**Source:** `supabase/migrations/241_or_discovery_jurisdictions.sql` lines 7-14
**Apply to:** All SQL in migration 268
```sql
-- Pattern: WHERE NOT EXISTS guard instead of ON CONFLICT for tables without unique constraints
-- race_candidates: use WHERE NOT EXISTS (no unique constraint)
-- discovery_jurisdictions: ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING (has unique constraint)
-- politician INSERT: ON CONFLICT DO NOTHING is safe (has primary key)
```

### Section-header comments in migrations
**Source:** `supabase/migrations/197_ca_governor_challengers.sql` lines 9-12
**Apply to:** Migration 268 — use named sections for each logical task
```sql
-- ============================================================
-- Section A: ME primary winners — race_candidates
-- ============================================================

-- ============================================================
-- Section B: lavote November 2026 discovery_jurisdictions UPDATE
-- ============================================================
```

### npm install pattern for ev-ui upgrades
**Source:** `C:/Transparent Motivations/essentials/package.json` line 14
**Apply to:** Plan 90-01 UI workstream
```json
"@empoweredvote/ev-ui": "^0.9.1"
```
`npm install` in `C:/Transparent Motivations/essentials` picks up latest satisfying `^0.9.1` (currently 0.9.2, after publish: 0.9.3). No lockfile pin to remove.

### paddingRight nudge — review after showLabels fix
**Source:** `src/components/ElectionsView.jsx` line 735 and `src/pages/Results.jsx` line 1327
**Apply to:** Both call sites — may be removable after `showLabels={false}` removes label whitespace
```jsx
paddingRight: 14, // nudge compass left so the widest axis label clears the card edge
```
With `showLabels={false}`, no axis labels exist. Planner should test with and without this nudge after 0.9.2 install and decide. If removed, update both ElectionsView.jsx and Results.jsx.

### CSS overflow rule for MiniCompass SVG
**Source:** `src/index.css` lines 176-179
**Apply to:** No change needed — keep as-is
```css
/* MiniCompass: SVG and its foreignObject tooltip must overflow the container frame */
.mini-compass-host svg {
  overflow: visible !important;
}
```

---

## No Analog Found

All files have analogs. No items in this section.

---

## Key Decision Points for Planner

| Decision | Recommendation |
|----------|---------------|
| Combine `showLabels` + `dotRadius` in one ev-ui PR? | Yes — ship both in a single 0.9.3 release to avoid intermediate state where labels are fixed but dots remain oversized |
| `dotRadius` value | Start with `2.5`; `3.0` is acceptable if `2.5` looks too faint at size=190 |
| Remove `paddingRight: 14` nudge? | Test visually after 0.9.2 install; likely removable but must verify in both ElectionsView + Results |
| ME-01 Pingree duplicate INSERT risk | Use `WHERE NOT EXISTS` guard; `ON CONFLICT DO NOTHING` is insufficient for race_candidates |
| lavote November ID unavailable | Migration 268 can still run without the lavote UPDATE; document the deferred UPDATE in SUMMARY |

---

## Metadata

**Analog search scope:** `supabase/migrations/`, `src/components/`, `src/pages/`, `C:/ev-ui/ev-ui-main/src/`, `.planning/templates/`
**Files scanned:** 15 migrations, MiniCompass.jsx, ElectionsView.jsx (call site), Results.jsx (call site), RadarChartCore.jsx (local 0.8.12), publish.yml, elections-seed.md template
**Pattern extraction date:** 2026-06-04
