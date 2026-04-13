# Phase 3: Unopposed and Empty Race UX - Research

**Researched:** 2026-04-13
**Domain:** React component extension, ev-ui design system, race data shape
**Confidence:** HIGH

## Summary

This phase extends `ElectionsView.jsx` to render three race states (contested, unopposed, empty) with visual differentiation. All the required infrastructure already exists: the race object from the backend already carries `district_type` (which encodes government level and branch), the grouping/sorting logic in `ElectionsView` already uses it, and the ev-ui design system exports the Empower pillar color tokens directly.

The two key research questions are fully resolved. First, the Empower pillar brand color tokens are confirmed from both the live design system site and direct inspection of the installed `@empoweredvote/ev-ui` npm bundle. The exact tokens are `pillars.empower.light` (`#FAF6F5`) for the notice box background and `pillars.empower.textColor` (`#E61B00`) for the border accent. Second, government level (Local/State/Federal) and branch (Executive/Legislative/Judicial) are both derivable from the existing `district_type` field on every race object — no backend changes needed.

The primary implementation challenge is that `SubGroupSection` from ev-ui does not accept a `badge` prop or a header slot. The "Running Unopposed" badge cannot be injected into the SubGroupSection header. The badge must be rendered separately, positioned visually adjacent to the race label using a wrapper element in `ElectionsView.jsx`.

**Primary recommendation:** Extend `ElectionsView.jsx` only. No backend changes, no ev-ui changes. Use existing `district_type` for all sort logic, use `pillars` import from `@empoweredvote/ev-ui` for all color tokens.

## Standard Stack

No new libraries. This phase uses only what already exists in the project.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@empoweredvote/ev-ui` | installed | `SubGroupSection`, `GovernmentBodySection`, `pillars`, design tokens | Already used in ElectionsView |
| React 19/JSX | installed | Component rendering | Project standard |
| Tailwind CSS 4 | installed | Inline utility classes | Project standard |

### No New Installations Required

All tokens, components, and utilities needed are already installed.

## Architecture Patterns

### Recommended Project Structure

No new files. All changes live in one existing file:

```
src/
└── components/
    └── ElectionsView.jsx    # Extend — badge, notice, zebra-stripe logic
```

No new component files needed. The badge pill and empty notice are simple inline JSX within `ElectionsView.jsx` — they are small enough that extracting them to separate files would add indirection without value.

### Pattern 1: Race State Derivation

**What:** Derive the render state (contested/unopposed/empty) from `race.shuffledCandidates.length` at render time, inside the existing `.map()` over `body.races`.

**When to use:** In the render pass, not in the `useMemo` preprocessing step. Candidate count is already correct post-shuffle; no new preprocessing needed.

```jsx
// Inside the body.races.map() render loop in ElectionsView.jsx
const candidateCount = race.shuffledCandidates.length;
const isUnopposed = candidateCount === 1;
const isEmpty = candidateCount === 0;
```

### Pattern 2: Unopposed Badge — Wrapper Approach

**What:** Because `SubGroupSection` does not accept a `badge` prop, wrap the `<SubGroupSection>` in a `<div>` with `position: relative` and render the badge as a sibling inside the wrapper. Alternatively — and more simply — render the badge inline in a flex row above the SubGroupSection, or pass a custom `title` string that contains the label text but note that title is rendered in uppercase by SubGroupSection's label style.

**Recommended approach:** Render a flex container wrapping the SubGroupSection title area before the SubGroupSection, then pass the standard `title` to SubGroupSection. The simplest correct approach is to render the badge outside SubGroupSection entirely, immediately before it in the JSX, using a `<div className="flex items-center gap-2 mb-1">` pattern.

**IMPORTANT constraint:** `SubGroupSection`'s header renders `title` in `font-size: 12px, font-weight: semibold, text-transform: uppercase, letter-spacing: 0.8px, color: textMuted`. Appending badge text to the `title` string would inherit all those styles — the badge must be a separate element.

```jsx
// Source: direct bundle inspection of @empoweredvote/ev-ui SubGroupSection
{isUnopposed && (
  <div className="flex items-center gap-2 mb-1">
    {/* Badge renders adjacent to or above the SubGroupSection label */}
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#6B7280',         // gray-500, neutral as specified
        backgroundColor: '#F3F4F6', // gray-100
        borderRadius: '9999px',
        padding: '2px 8px',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
      }}
    >
      Running Unopposed
    </span>
  </div>
)}
<SubGroupSection key={race.key} title={race.label}>
  ...candidates...
</SubGroupSection>
```

**Alternative — inline with SubGroupSection title via custom wrapper:** If the badge needs to appear visually on the same line as the label text, the only option is to position them together using absolute/relative CSS since SubGroupSection renders its own header internally. A `position: relative` wrapper with `position: absolute` badge placed at top-right is clean but adds complexity. The "badge above label" approach is simpler and consistent with the CONTEXT decision that "the badge does the signaling."

### Pattern 3: Empty Race Notice

**What:** When `isEmpty === true`, render a notice box in place of the candidate list, inside the `<SubGroupSection>` children slot.

**Color tokens (confirmed from bundle inspection):**
- Background: `#FAF6F5` — `pillars.empower.light` (coral-050)
- Border/accent: `#E61B00` — `pillars.empower.textColor` (coral-700, AA-safe text)
- Text color on background: `#E61B00` for the primary line (or `#1C1C1C` for neutral body text)

```jsx
// Source: pillars.empower from @empoweredvote/ev-ui (confirmed in bundle)
import { pillars } from '@empoweredvote/ev-ui';

// Inside SubGroupSection children when isEmpty:
{isEmpty ? (
  <div
    style={{
      backgroundColor: pillars.empower.light,   // #FAF6F5
      borderLeft: `3px solid ${pillars.empower.textColor}`, // #E61B00
      borderRadius: '6px',
      padding: '12px 16px',
    }}
  >
    <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>
      No candidates have filed
    </p>
    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>
      This seat is currently uncontested.
    </p>
  </div>
) : (
  race.shuffledCandidates.map(/* existing card render */)
)}
```

### Pattern 4: Zebra-Stripe Section Backgrounds

**What:** Alternate the background color of race sections within a single election group. Pattern resets per election.

**Where it goes:** In the `body.races.map()` loop, use the race's index within the current body's race list. The index is available as the second argument to `.map()`.

```jsx
// Alternating backgrounds — neutral tints, not tier colors
const stripeColors = ['transparent', '#F9FAFB']; // white / gray-50
// ...
{body.races.map((race, raceIdx) => {
  const stripeBg = stripeColors[raceIdx % 2];
  // ...
  return (
    <div key={race.key} style={{ backgroundColor: stripeBg, borderRadius: '4px', padding: '8px 0' }}>
      {isUnopposed && <BadgeRow />}
      <SubGroupSection title={race.label}>
        {/* candidates or empty notice */}
      </SubGroupSection>
    </div>
  );
})}
```

**Note on tint values:** The stripe colors must be visible against all three tier backgrounds (`#FFFFFF` federal, `#F7FBFC` state, `#EDF6F8` local). `transparent` and `#F9FAFB` (gray-50) work against all three — the contrast delta is sufficient for visual separation without competing with tier color. Claude's discretion applies here; see Recommendations section.

### Pattern 5: Race Sort by Level and Branch

**What:** The CONTEXT specifies sort order: Local → State → Federal (level), and within level: Executive → Legislative → Judicial (branch). This must be applied to `body.races` before render.

**Key finding:** Both level and branch are fully derivable from the existing `district_type` field on each race. No backend changes needed. The existing `getTier()` function already derives level. The existing `getBranch()` utility already derives branch.

**Level derivation (already in ElectionsView):**
```js
// getTier(district_type) already exists in ElectionsView.jsx
function getTier(districtType) {
  if (!districtType) return 'Other';
  if (districtType.startsWith('NATIONAL')) return 'Federal';
  if (districtType.startsWith('STATE')) return 'State';
  return 'Local';
}
// TIER_ORDER = ['Local', 'State', 'Federal', 'Other'] — already defined
```

**Branch derivation (from branchType.js):**
```js
// getBranch(districtType, officeTitle) already exists at src/utils/branchType.js
// Returns: 'Executive' | 'Legislative' | 'Judicial' | null
```

**Sort implementation — add to preprocessing in useMemo:**
```js
// In the hierarchy construction, races within each body should be sorted
// Current code: races: races.sort((a, b) => a.label.localeCompare(b.label))
// Replace with branch-aware sort:

const BRANCH_ORDER = { Executive: 0, Legislative: 1, Judicial: 2 };

races: races.sort((a, b) => {
  const branchA = getBranch(a.districtType, a.cleanedPosition) ?? 'Legislative';
  const branchB = getBranch(b.districtType, b.cleanedPosition) ?? 'Legislative';
  const bScore = (BRANCH_ORDER[branchA] ?? 1) - (BRANCH_ORDER[branchB] ?? 1);
  if (bScore !== 0) return bScore;
  return a.label.localeCompare(b.label); // alphabetical within same branch
})
```

**Note:** The `bodyOrderScore` function already handles inter-body ordering within a tier. The branch sort replaces the alphabetical-only intra-body sort for races within a single body.

**Critical note on current data shape:** Each race in the preprocessed hierarchy already carries `districtType` and `cleanedPosition` (set during the `useMemo` preprocessing). No new fields need to be added to the race object or to the API response.

### Anti-Patterns to Avoid

- **Adding `focal_point` fallback to empty races:** Empty races have no candidates, so `focal_point` is irrelevant — don't add any image-related logic for the empty notice.
- **Passing badge text via `title` prop to `SubGroupSection`:** The title is rendered uppercase, small-caps style — injecting badge markup via title string produces broken output.
- **Filtering out empty or unopposed races before render:** The CONTEXT explicitly states nothing is hidden. Guard against any `.filter()` on races array before render.
- **Using coral-500 (`#FF5740`) as text color:** It fails WCAG AA on white (3.14:1). Use coral-700 (`#E61B00`) for text, coral-050 (`#FAF6F5`) for background.
- **Applying zebra-stripe backgrounds at the body level instead of race level:** The spec says races alternate within a group; body-level striping would stripe at the wrong granularity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Empower pillar color | Hardcoded hex strings | `pillars.empower` from `@empoweredvote/ev-ui` | Bundle-confirmed export; stays in sync with design system |
| Level derivation | New utility function | Existing `getTier()` in ElectionsView.jsx | Already handles all district_type values |
| Branch derivation | New utility function | Existing `getBranch()` from `src/utils/branchType.js` | Already handles COUNTY heuristics correctly |
| Candidate randomization | New shuffle | Existing `seededShuffle()` + sessionSeed | Unopposed candidates use same shuffle pass |

**Key insight:** Every tool needed already exists in the codebase. This phase is a rendering extension, not new infrastructure.

## Common Pitfalls

### Pitfall 1: SubGroupSection Has No Badge Slot

**What goes wrong:** Developer tries to pass badge as a prop to `<SubGroupSection badge="Running Unopposed">` — prop is silently ignored, badge never renders.

**Why it happens:** SubGroupSection only accepts `title`, `websiteUrl`, and `children` per bundle inspection.

**How to avoid:** Render the badge as a sibling element positioned before or overlaid on the SubGroupSection, not inside its API.

**Warning signs:** Badge prop passes without error (React silently ignores unknown props on function components) but nothing renders.

### Pitfall 2: Empty Race Row Disappears from Backend Query

**What goes wrong:** 0-candidate races never reach the frontend because the SQL query uses a WHERE clause that filters nulls.

**Why it doesn't apply here:** Phase 1 already fixed this — the backend uses `LEFT JOIN` with `candidate_status != 'withdrawn'` in the ON clause, not the WHERE clause. The `candidates: []` array is returned for empty races. Confirmed in `electionService.ts` line ~350: `LEFT JOIN essentials.race_candidates rc ON rc.race_id = r.id`. The frontend already receives empty races.

**How to confirm:** The `racesMap` accumulation in `electionService.ts` adds races before checking `row.candidate_id !== null` for candidates. A race row with `candidate_id = null` creates a `race` with `candidates: []`.

**Warning signs:** No empty race ever appears in test data — could indicate the Phase 1 fix isn't deployed, not a Phase 3 bug.

### Pitfall 3: Seeded Shuffle on Empty Array

**What goes wrong:** `seededShuffle([], sessionSeed)` is called for empty races in the preprocessing step — it's harmless (returns `[]`) but the rendered loop will produce zero cards.

**How to avoid:** The empty notice render branches on `isEmpty` (candidateCount === 0) before rendering the `.map()` over shuffledCandidates. Empty shuffle output is expected and correct.

### Pitfall 4: Zebra Stripe Invisible on Tier Backgrounds

**What goes wrong:** The stripe alternation uses colors that blend into one of the three tier backgrounds (white/`#F7FBFC`/`#EDF6F8`).

**How to avoid:** Use only `transparent` (matches any background) and a gray with enough contrast on the darkest tier background (`#EDF6F8`). Gray-50 (`#F9FAFB`) on `#EDF6F8` has very low contrast — consider `#E8EFF0` (teal-100) or simply a 4px left border on even rows instead of a background fill.

**Better alternative:** Use a left-border stripe instead of background fill — `borderLeft: '2px solid #E5E7EB'` on alternating rows. This doesn't interfere with tier backgrounds at all.

### Pitfall 5: Branch Sort Breaks Races Without `district_type`

**What goes wrong:** `getBranch(null, title)` returns `null`. If the sort key is `null`, comparison produces `NaN` and the sort is unstable/broken.

**How to avoid:** Default `null` branch to `'Legislative'` (BRANCH_ORDER index 1) in the sort comparator, which places unknown races in the middle of the ordering.

## Code Examples

### Confirmed: Empower pillar tokens from ev-ui

```jsx
// Source: @empoweredvote/ev-ui bundle, pillars export (confirmed 2026-04-13)
import { pillars } from '@empoweredvote/ev-ui';

// pillars.empower = {
//   name: "Empower",
//   accent: "coral",
//   color: "#FF5740",        // coral-500 — UI accent only (3.14:1, not text-safe)
//   dark: "#E61B00",         // coral-700 — hover state
//   light: "#FAF6F5",        // coral-050 — background tint
//   textColor: "#E61B00",    // coral-700, AA-safe text (4.64:1 on white)
// }
```

### Confirmed: SubGroupSection accepts only title, websiteUrl, children

```jsx
// Source: @empoweredvote/ev-ui bundle SubGroupSection (confirmed 2026-04-13)
// function SubGroupSection({ title, websiteUrl, children })
// Header renders: <span style={label}>{title}</span>
// NO badge prop, NO titleSuffix, NO headerSlot

// Correct pattern — badge as sibling above SubGroupSection:
<div>
  {isUnopposed && <UnopposedBadge />}
  <SubGroupSection title={race.label}>
    {race.shuffledCandidates.map(...)}
  </SubGroupSection>
</div>
```

### Confirmed: district_type values and their tier/branch mapping

```js
// Source: electionService.ts interface + branchType.js (confirmed 2026-04-13)
// district_type values in use:
//   'NATIONAL_UPPER'  → Federal / Legislative
//   'NATIONAL_LOWER'  → Federal / Legislative
//   'NATIONAL_EXEC'   → Federal / Executive
//   'STATE_UPPER'     → State / Legislative
//   'STATE_LOWER'     → State / Legislative
//   'STATE_EXEC'      → State / Executive
//   'LOCAL'           → Local / Legislative
//   'LOCAL_EXEC'      → Local / Executive
//   'COUNTY'          → Local / Executive or Legislative (heuristic by title)
//   'SCHOOL'          → Local / Legislative
//   'JUDICIAL'        → Local (or State) / Judicial
//   null              → inferred by inferDistrictType(), fallback 'Other'
```

### Confirmed: ElectionsView race object shape (post-preprocessing)

```js
// Source: ElectionsView.jsx useMemo preprocessing (confirmed 2026-04-13)
// Each race in body.races has:
{
  key: string,          // subgroupKey (position + party)
  label: string,        // display label
  party: string | null,
  districtType: string | null,   // from race.district_type
  raceId: string,
  shuffledCandidates: ElectionCandidate[],  // [] for empty races
  cleanedPosition: string,       // cleaned position_name
}
// candidateCount = race.shuffledCandidates.length
// isUnopposed = candidateCount === 1
// isEmpty = candidateCount === 0
```

## Design Token Recommendations (Claude's Discretion)

The context delegates exact badge spacing/typography and stripe tint values to Claude.

### Unopposed Badge Pill

Recommended specs:
- Font size: `11px` — smaller than the SubGroupSection label (12px) to maintain hierarchy
- Font weight: `600` (semibold)
- Color: `#6B7280` (gray-500) — neutral, no editorial weight as specified
- Background: `#F3F4F6` (gray-100) — subtle pill, neutral gray
- Border radius: `9999px` (full pill)
- Padding: `2px 8px`
- Letter spacing: `0.3px` — readable but not as stylized as the uppercase label

### Empty Race Notice Box

Recommended specs:
- Background: `#FAF6F5` (`pillars.empower.light`) — light coral tint
- Left border: `3px solid #E61B00` (`pillars.empower.textColor`) — coral-700 accent
- Border radius: `6px`
- Padding: `12px 16px`
- Primary text: `"No candidates have filed"` — 14px, semibold, `#1C1C1C`
- Secondary text: `"This seat is currently uncontested."` — 13px, regular, `#6B7280`

### Alternating Section Backgrounds

Recommended approach: left-border stripe (not background fill), to avoid conflicts with tier background colors:
- Even races (index % 2 === 0): no decoration
- Odd races (index % 2 === 1): `borderLeft: '2px solid #E5E7EB'` (gray-200) with `paddingLeft: '8px'`

If background fill is preferred over border:
- Even: `transparent`
- Odd: `rgba(0,0,0,0.02)` — 2% black overlay works on any tier background

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Alphabetical race sort within bodies | Branch-ordered sort (Exec → Legislative → Judicial) + alphabetical tiebreak | Phase 3 adds the branch sort; alphabetical was Phase 2 placeholder |
| All races rendered identically | Three visual states (contested / unopposed / empty) | Phase 3 introduces differentiation |

## Open Questions

1. **Badge position relative to SubGroupSection label**
   - What we know: SubGroupSection renders its own label in a flex header. The badge must be outside that component.
   - What's unclear: Whether to put the badge above the label row, or in a flex row that visually appears to be on the same line by adjusting margins.
   - Recommendation: Put the badge above the SubGroupSection (separate row). It's simpler and avoids any layout coupling to SubGroupSection internals. If design review requires same-line placement, a `position: absolute` overlay on a `position: relative` wrapper is viable.

2. **Zebra-stripe stripe reset granularity**
   - What we know: CONTEXT says "pattern resets per election." ElectionsView already groups by election at the top level.
   - What's unclear: Whether reset means per-election (index resets to 0 for each election's races) or per-body within an election.
   - Recommendation: Reset per body (innermost `.map()` over `body.races`), since the index from `.map((race, idx) => ...)` naturally resets for each body. This produces alternation within each government body's race list, which is the most visually useful granularity.

## Sources

### Primary (HIGH confidence)
- `@empoweredvote/ev-ui` npm bundle at `node_modules/@empoweredvote/ev-ui/dist/index.mjs` — SubGroupSection API, GovernmentBodySection API, `pillars` tokens, `tierColors`, `colorScales.coral`, all design tokens
- `C:/Transparent Motivations/essentials/src/components/ElectionsView.jsx` — current component, race preprocessing, existing sort logic
- `/c/EV-Accounts/backend/src/lib/electionService.ts` — race object shape, `ElectionRace` interface, candidate array accumulation logic
- `C:/Transparent Motivations/essentials/src/utils/branchType.js` — `getBranch()` utility, district_type to branch mapping

### Secondary (MEDIUM confidence)
- `empoweredvote.github.io/ev-ui` (WebFetch) — confirmed Empower pillar coral color tokens; matched bundle values exactly

### Tertiary (LOW confidence)
- None — all critical claims verified from primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all tokens confirmed from installed bundle
- Architecture: HIGH — SubGroupSection API confirmed from bundle; race shape confirmed from TS interface
- Design tokens: HIGH — `pillars.empower` confirmed from ev-ui bundle inspection; exact hex values documented
- Race field availability: HIGH — `district_type` on every race; `getTier()` and `getBranch()` already exist
- Pitfalls: HIGH — SubGroupSection prop list confirmed; empty race fix confirmed in electionService.ts

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (ev-ui design tokens stable; backend interface stable)
