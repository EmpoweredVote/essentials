# Phase 28: Judicial Compass Frontend + Communities - Research

**Researched:** 2026-05-06
**Domain:** React/JSX frontend (Profile.jsx, CandidateProfile.jsx, CompassCard.jsx) + PostgreSQL migration (connect.communities + inform.compass_topics)
**Confidence:** HIGH — all findings from direct source code inspection; no external research needed

---

## Summary

Phase 28 has two independent workstreams: (1) frontend changes to render judicial compass topics with burnt orange visual treatment and sub-role filtering, and (2) a DB migration to seed 8 Focused Communities and populate fc_community_slug on the 8 judicial topics.

The backend is already fully wired from Phase 27: `compassService.ts` returns `applies_judicial: true` for all 8 judicial topics (false for all others), `Profile.jsx` derives `districtScope='judicial'` for JUDICIAL/NATIONAL_JUDICIAL district_types, and `CompassCard.jsx` maps `districtScope='judicial'` to the `applies_judicial` key. When districtScope='judicial', all 8 judicial topics pass the `t[key] !== false` filter.

The main frontend work is: (a) sub-role filtering within those 8 topics to show only 6 to a given candidate, (b) adding the burnt orange visual treatment and "Judicial Evaluation" section header, and (c) fixing two gaps — `CandidateProfile.jsx` is missing the judicial arm in its districtScope IIFE, and `Profile.jsx`'s isJudge gate blocks judicial profiles from seeing CompassCard at all when they have no stances yet.

The migration work exactly parallels Phase 24 (companion communities for local topics): INSERT 8 rows into `connect.communities` using subselect topic_id resolution, then UPDATE `inform.compass_topics.fc_community_slug`.

**Primary recommendation:** Structure Plan 28-01 as four discrete changes to two files (Profile.jsx + CandidateProfile.jsx) plus extension of CompassCard.jsx to accept a `judicialSubRole` prop. The DB migration (Plan 28-02) is a straight Phase 24 clone pattern.

---

## Standard Stack

No new libraries needed. All work uses the existing stack.

### Core (already in use)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React | 19 | UI framework | Profile.jsx, CandidateProfile.jsx, CompassCard.jsx |
| Tailwind CSS | 4 | Styling | Inline style overrides are the established pattern for custom colors |
| @empoweredvote/ev-ui | current | RadarChartCore, StanceAccordion, ExpandCompassNudge | CompassCard already uses all three |

### Supporting (DB migration)
| Tool | Purpose | Notes |
|------|---------|-------|
| supabase db push | Apply migration to production | Run from `C:/Focused Communities` directory |
| psql | Verification queries | DATABASE_URL from C:/EV-Accounts/backend/.env |

**No new npm packages required.**

---

## Architecture Patterns

### Current Compass Render Flow (Profile.jsx)

```
Profile.jsx
  ↓ fetchPolitician(id) → pol (has district_type, office_title, policy_engagement_level)
  ↓ districtScope IIFE (lines 220-227 in Profile.jsx)
       LOCAL/LOCAL_EXEC/COUNTY → 'local'
       STATE_* → 'state'
       JUDICIAL/NATIONAL_JUDICIAL → 'judicial'   ← added in Phase 27-03
       NATIONAL_* → 'federal'
       else → null
  ↓ CompassCard receives districtScope='judicial'
  ↓ CompassCard scopedTopics = allTopics.filter(t => t.applies_judicial !== false)
       → returns all 8 judicial topics
  ↓ PROBLEM: all 8 pass; sub-role filtering not yet implemented
```

### Current Gate Behavior in Profile.jsx (GAP — must fix in 28-01)

Lines 198-217 of `Profile.jsx` contain an explicit guard:
```jsx
const isJudge = pol.district_type === 'JUDICIAL' || pol.district_type === 'NATIONAL_JUDICIAL';
if (isJudge && engagement === 'full' && !hasStances) {
  return (
    <section className="mt-8">
      ...placeholder text about judicial records...
    </section>
  );
}
```

This guard short-circuits before `CompassCard` renders. For Phase 28, the CONTEXT.md decision is: render topic cards with empty notches (no special empty state). The guard must be REMOVED or bypassed. Since Phase 30 immediately populates stance data, the guard is now obsolete for judicial profiles. The guard remains valid only for non-judicial judges (if any) in edge cases.

**Fix:** Remove the `isJudge && !hasStances` guard entirely. The CompassCard's existing gate (`politicianIdsWithStances.has(politicianId)`) handles the empty case correctly — but it also gates out profiles with no stances at all. For Phase 28's "render empty notches" behavior, Plan 28-01 needs to decide whether to relax the CompassCard gate for judicial profiles or render a new dedicated judicial section that bypasses the gate.

**Recommended approach (Claude's discretion):** For judicial profiles (districtScope='judicial'), render a new `<JudicialCompassSection>` component that bypasses the `politicianIdsWithStances` gate and always shows the 6 applicable topics with empty/zero notches. This is the cleanest implementation: the existing CompassCard remains unchanged for all other profile types.

### CandidateProfile.jsx — GAP in districtScope Derivation

Lines 171-177 of `CandidateProfile.jsx`:
```jsx
districtScope={(() => {
  const dt = pol.district_type || '';
  if (dt === 'LOCAL' || dt === 'LOCAL_EXEC' || dt === 'COUNTY') return 'local';
  if (dt.startsWith('STATE_')) return 'state';
  if (dt.startsWith('NATIONAL_')) return 'federal';
  return null; // district_type unavailable for challenger — show all topics
})()}
```

The `JUDICIAL` arm is **missing**. Any judicial candidate with a `politician_id` (incumbent) would receive `districtScope=null` and see ALL compass topics. Fix: add `if (dt === 'JUDICIAL' || dt === 'NATIONAL_JUDICIAL') return 'judicial';` before the `NATIONAL_` check.

### judicial_role NOT in API Response (KEY FINDING)

`getCompassTopics()` SELECT (compassService.ts line 111):
```typescript
.select('id,topic_key,title,short_title,question_text,is_live,version,office_scope,fc_community_slug')
```

`judicial_role` is NOT selected. The returned topic objects do NOT include `judicial_role`. The frontend has `applies_judicial: boolean` (true for all 8 judicial topics) but cannot distinguish judge-specific from DA-specific topics via this flag.

**Two options for sub-role filtering:**

Option A — Add `judicial_role` to the SELECT in `getCompassTopics()` (backend change):
```typescript
.select('id,topic_key,title,short_title,question_text,is_live,version,office_scope,fc_community_slug,judicial_role')
```
Pros: Clean, explicit, future-proof. Cons: requires backend deploy before frontend can use it.

Option B — Use topic_key suffix to derive judicial_role on the frontend:
```javascript
// Judge-only topic_keys: 'judicial-interpretation', 'judicial-bail-pretrial'
// DA-only topic_keys: 'judicial-prosecution-priorities', 'judicial-police-accountability'
// Universal: all others prefixed with 'judicial-'
```
Pros: No backend change needed. Cons: couples frontend to topic_key naming convention.

**Recommendation:** Option A. Add `judicial_role` to the getCompassTopics SELECT. Deploy backend first, then frontend. The backend change is a one-line addition with no breaking impact.

### Sub-Role Detection via Office Title

The CONTEXT.md decision: detect sub-role from office title string matching.

Available title strings:
- In `Profile.jsx`: `pol.office_title` (from essentials.offices.title via SQL JOIN — always populated for incumbents with office records)
- In `CandidateProfile.jsx`: `pol.office_title` (if incumbent) OR `candidateData.position_name` (from the race record — populated via `inferDistrictType` logic in electionService.ts)

The `politicianTitle` prop passed to `CompassCard` (or the new judicial section) is:
- `Profile.jsx` line 233: `pol.office_title || ''`
- `CandidateProfile.jsx` line 170: `pol.office_title || candidateData?.position_name || ''`

String matching logic per CONTEXT.md:
```javascript
function deriveJudicialSubRole(officeTitle) {
  const t = (officeTitle || '').toLowerCase();
  if (t.includes('judge')) return 'judge';
  if (t.includes('city attorney') || t.includes('district attorney')) return 'city_attorney_da';
  return null; // fallback: show only universals (4 topics)
}
```

Fallback behavior (CONTEXT.md locked): show only applicable topics — universals at minimum, never hide everything.

### Recommended Project Structure Change

Plan 28-01 adds sub-role awareness to the judicial compass render path. The cleanest implementation uses a new `judicialSubRole` prop on CompassCard (or a wrapper), computed in Profile.jsx and CandidateProfile.jsx from the office title:

```
Profile.jsx / CandidateProfile.jsx
  → computes judicialSubRole from pol.office_title (or position_name)
  → passes to CompassCard as judicialSubRole='judge'|'city_attorney_da'|null
CompassCard (or new JudicialCompassSection)
  → if districtScope==='judicial': further filter scopedTopics by judicial_role
     - judicialSubRole='judge': keep topics where judicial_role===null OR judicial_role==='judge'
     - judicialSubRole='city_attorney_da': keep topics where judicial_role===null OR judicial_role==='city_attorney_da'
     - judicialSubRole===null: keep all 8 (fallback — show everything)
```

### Recommended Project Structure (visual treatment)

The "Judicial Evaluation" section header and burnt orange treatment are most naturally implemented as a wrapper above the CompassCard, rendering conditionally when `districtScope==='judicial'`. Profile.jsx and CandidateProfile.jsx both render CompassCard — the section header lives in both pages or in a shared wrapper component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Radar chart | Custom SVG chart | RadarChartCore from @empoweredvote/ev-ui | Already in CompassCard; same instance works |
| Stance accordion | Custom accordion | StanceAccordion from @empoweredvote/ev-ui | Already in CompassCard |
| Community row INSERT | Custom UUID resolution | Subselect on topic_key (Phase 24 pattern) | Pattern verified; avoids hardcoded UUIDs |

**Key insight:** The judicial compass is a re-use of the existing CompassCard with visual overrides and data filtering — not a new UI component. Only the section header and burnt orange accents are new UI elements.

---

## Common Pitfalls

### Pitfall 1: NATIONAL_JUDICIAL caught as 'federal' in districtScope IIFE
**What goes wrong:** If the `JUDICIAL` arm is placed AFTER `dt.startsWith('NATIONAL_')`, then `NATIONAL_JUDICIAL` district_type resolves to 'federal' and sees legislative topics instead of judicial ones.
**Why it happens:** `NATIONAL_JUDICIAL`.startsWith('NATIONAL_') is true.
**How to avoid:** The JUDICIAL check was already placed correctly in Profile.jsx (Phase 27-03). Replicate this ordering exactly in CandidateProfile.jsx.
**Warning signs:** Judge profiles seeing federal topics.

### Pitfall 2: isJudge guard in Profile.jsx blocks judicial profiles from rendering compass
**What goes wrong:** The guard at lines 198-217 of Profile.jsx returns a placeholder for `isJudge && !hasStances`. Since judicial topics in Phase 28 have no stance data yet (Phase 30 does that), ALL judicial profiles would hit this guard and never see the new judicial compass section.
**Why it happens:** The guard was added before Phase 27-03 as a good-faith placeholder. It's now obsolete for the Phase 28 behavior.
**How to avoid:** Remove the guard or add a districtScope check so it only activates for non-judicial edge cases.

### Pitfall 3: judicial_role missing from API response breaks sub-role filter
**What goes wrong:** Frontend filters `allTopics` on `t.judicial_role === 'judge'` but the field is undefined on every topic — all 8 judicial topics pass the filter incorrectly.
**Why it happens:** `judicial_role` is not in the `getCompassTopics()` SELECT.
**How to avoid:** Add `judicial_role` to the backend SELECT before implementing frontend filter logic. Verify with `console.log(allTopics.find(t => t.topic_key === 'judicial-interpretation'))` — the `judicial_role` field must be present.

### Pitfall 4: CandidateProfile.jsx districtScope missing JUDICIAL arm
**What goes wrong:** A judicial incumbent on CandidateProfile receives `districtScope=null`, sees all compass topics (including non-judicial), and the judicial visual treatment is never triggered.
**Why it happens:** Phase 27-03 only fixed Profile.jsx — CandidateProfile.jsx was not updated.
**How to avoid:** Update both files in Plan 28-01.

### Pitfall 5: Slug collision (unlikely but verify)
**What goes wrong:** One of the 8 proposed judicial community slugs already exists in connect.communities.
**Why it happens:** Community expansion migration already seeded 21 federal/state/local communities.
**How to avoid:** Confirmed zero collisions for all 8 proposed slugs (verified by searching all Focused Communities migrations). Existing slugs include 'deportation-priorities', 'reproductive-rights', 'campaign-finance-reform', etc. — none overlap.

### Pitfall 6: Position 3 notch (neutral) color looks like non-judicial tone
**What goes wrong:** A grey/blue midpoint notch clashes with the warm palette decision.
**Why it happens:** Standard compass uses teal (#00657c) and coral (#ff5740) — both cool/bright.
**How to avoid:** Use amber (#f59e0b) for notch position 3 (neutral midpoint); deep red (#b91c1c) for position 5 (far end); gold (#fbbf24) for position 1. All five notch colors should be warm-spectrum. The existing teal/coral palette should not appear on judicial topic cards.

---

## Code Examples

### Burnt Orange Palette for Judicial Treatment

Based on the existing design system (index.css, CompassCard.jsx visual patterns):

```javascript
// Judicial accent colors — Claude's discretion per CONTEXT.md
const JUDICIAL_COLORS = {
  accent: '#c2410c',            // Burnt orange — section header, card left border
  badge_bg: '#ea580c',          // Slightly brighter for "Judicial" tag background
  badge_text: '#ffffff',        // White text on badge
  section_text: '#c2410c',      // Section header text color
  // Warm notch palette (5 positions, position 1=mildest, position 5=strongest)
  notch_1: '#fbbf24',           // Amber/gold
  notch_2: '#f97316',           // Orange
  notch_3: '#f59e0b',           // Warm amber (neutral)
  notch_4: '#dc2626',           // Red
  notch_5: '#b91c1c',           // Deep red
};
```

### Scale of Justice SVG (inline, fits existing SVG pattern in CompassCard)

```jsx
// Scale of Justice icon — consistent with compass SVG style in CompassCard
const ScaleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="12" y1="3" x2="12" y2="21" />
    <line x1="3" y1="8" x2="21" y2="8" />
    <path d="M3 8 Q3 14 9 14 Q3 14 3 8Z" />
    <path d="M15 8 Q15 14 21 14 Q15 14 15 8Z" />
  </svg>
);
```

### Sub-Role Filter Logic

```javascript
// Source: derived from CONTEXT.md locked decisions + compassService.ts judicial_role schema
function filterJudicialTopics(judicialTopics, judicialSubRole) {
  if (!judicialSubRole) return judicialTopics; // fallback: show all 8
  return judicialTopics.filter(t => {
    // judicial_role: null = universal, 'judge' = judge-only, 'city_attorney_da' = DA-only
    return t.judicial_role === null || t.judicial_role === judicialSubRole;
  });
  // Returns 6 topics (4 universal + 2 role-specific)
}

function deriveJudicialSubRole(officeTitle) {
  const t = (officeTitle || '').toLowerCase();
  if (t.includes('judge')) return 'judge';
  if (t.includes('city attorney') || t.includes('district attorney')) return 'city_attorney_da';
  return null; // universals only — never hide everything
}
```

### Phase 28-02 Migration Pattern (exact parallel to Phase 24)

```sql
-- File: C:/Focused Communities/supabase/migrations/20260506000001_phase28_judicial_communities.sql
-- (Use today's date: 2026-05-06; next sequence after 20260505000001 is 20260506000001)

BEGIN;

-- SECTION 1: connect.communities (8 rows)

INSERT INTO connect.communities (slug, name, description, topic_id)
SELECT 'criminal-justice-philosophy',
       'Criminal Justice Philosophy',
       '<authored description>',
       t.id
FROM inform.compass_topics t
WHERE t.topic_key = 'judicial-criminal-justice' AND t.is_live = true
ON CONFLICT (slug) DO NOTHING;

-- ... 7 more topics

-- SECTION 2: inform.compass_topics.fc_community_slug back-fill (8 rows)

UPDATE inform.compass_topics SET fc_community_slug = 'criminal-justice-philosophy'
WHERE topic_key = 'judicial-criminal-justice' AND is_live = true;

-- ... 7 more updates

COMMIT;
```

### Judicial Section Header JSX Pattern

```jsx
{districtScope === 'judicial' && (
  <section className="mt-8">
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      <ScaleIcon color="#c2410c" />
      <h2
        className="text-2xl font-bold"
        style={{ color: '#c2410c', margin: 0, fontFamily: "'Manrope', sans-serif" }}
      >
        Judicial Evaluation
      </h2>
    </div>
    {/* judicial topic cards rendered here */}
  </section>
)}
```

---

## DB Migration Details (Plan 28-02)

### Migration Filename Convention
The last Focused Communities migration is:
`20260505000001_phase25_scope_audit.sql`

Phase 28 migration filename: `20260506000001_phase28_judicial_communities.sql`
- Date: 2026-05-06 (today)
- Sequence: 000001 (first migration on this date)

### topic_key to community slug mapping (8 topics)

| topic_key | community slug | community name | judicial_role |
|-----------|---------------|----------------|---------------|
| `judicial-criminal-justice` | `criminal-justice-philosophy` | Criminal Justice Philosophy | NULL (universal) |
| `judicial-access-to-justice` | `access-to-justice` | Access to Justice | NULL (universal) |
| `judicial-government-deference` | `government-deference` | Government Deference | NULL (universal) |
| `judicial-transparency` | `court-transparency` | Court Transparency | NULL (universal) |
| `judicial-interpretation` | `legal-interpretation` | Legal Interpretation | 'judge' |
| `judicial-bail-pretrial` | `bail-and-pretrial` | Bail and Pretrial | 'judge' |
| `judicial-prosecution-priorities` | `prosecution-priorities` | Prosecution Priorities | 'city_attorney_da' |
| `judicial-police-accountability` | `police-accountability` | Police Accountability | 'city_attorney_da' |

Note: All 8 slugs confirmed zero collision with existing connect.communities slugs.

### connect.communities Schema (verified from Phase 24 research)

```
connect.communities
├── id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
├── topic_id     UUID NOT NULL
├── slug         TEXT NOT NULL UNIQUE
├── name         TEXT NOT NULL
├── description  TEXT (nullable)
├── member_count INT NOT NULL DEFAULT 0
├── thread_count INT NOT NULL DEFAULT 0
├── created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
├── updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
└── slice_label  TEXT (nullable)
```

Required for INSERT: `topic_id`, `slug`, `name`. Include `description` for Phase 28.
Do NOT include: `id`, `member_count`, `thread_count`, `created_at`, `updated_at`, `slice_label`.

### Community Description Tone (from Phase 24 research)

Established pattern from `20260417000002_community_expansion.sql`:
- Single sentence, 20-30 words
- Second-person invitation: "Explore…", "Discuss…", "Engage with…"
- Lists 3-4 key sub-debates the stances span
- No 1-5 scale references, no explicit party framing
- Citizen evaluation framing per CONTEXT.md: "How should voters evaluate judicial candidates on this dimension?"

Example descriptions (to be authored in Plan 28-02):

1. **criminal-justice-philosophy:** "Explore rehabilitation, restorative justice, deterrence, and punitive accountability — and how judicial candidates weigh public safety against second chances."
2. **access-to-justice:** "Discuss procedural barriers to courts, legal costs, standing requirements, and how accessible civil litigation should be for ordinary citizens."
3. **government-deference:** "Explore when courts should defer to government agencies and when they should side with citizens — and how judicial candidates balance official authority against individual rights."
4. **court-transparency:** "Discuss public access to court proceedings, sealed records, judicial discretion over open hearings, and how much the public can see of the legal system in action."
5. **legal-interpretation:** "Explore textualism, purposivism, living constitutionalism, and how judges decide whether the law's original words or its evolving intent should guide their rulings."
6. **bail-and-pretrial:** "Discuss pretrial detention, cash bail reform, judicial deference to prosecutors, and how judges weigh public safety against the presumption of innocence."
7. **prosecution-priorities:** "Explore diversion programs, prosecutorial discretion, mandatory prosecution, and how DA and City Attorney candidates decide which cases are worth pursuing."
8. **police-accountability:** "Discuss civil litigation against city employees, independent investigation standards, and how DA and City Attorney candidates balance defending the city against holding officials accountable."

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No judicial compass topics | 8 judicial topics live in DB with applies_judicial flag | Phase 27 (2026-05-07) | Phase 28 can now filter and display |
| CompassCard shows placeholder for judges without stances | (to be changed) Remove guard, show empty notch UI | Phase 28-01 | Judges see evaluation framework immediately |
| No companion communities for judicial topics | 8 communities seeded | Phase 28-02 | Focused Communities links on judicial topic cards |

---

## Open Questions

1. **CompassCard vs. new component for judicial section**
   - What we know: CompassCard gates on `politicianIdsWithStances.has(politicianId)` — it won't render for judicial candidates who have no stances
   - What's unclear: Whether Plan 28-01 should bypass this gate within CompassCard by passing a `forceShow` prop, or render a separate section outside CompassCard
   - Recommendation: A new `<JudicialCompassSection>` in Plan 28-01 that renders the 6 judicial topics directly from `allTopics` (no stance gate) is cleaner than modifying CompassCard's gate logic. This component shows empty notch cards (no radar chart — no answers). The existing CompassCard renders normally for judicial candidates once Phase 30 populates stance data.

2. **Notch color prop on RadarChartCore**
   - What we know: CompassCard uses `<RadarChartCore>` from `@empoweredvote/ev-ui`; the warm notch palette is specified in CONTEXT.md for visual treatment
   - What's unclear: Whether RadarChartCore accepts a color prop for notch colors, or whether notch colors are hardcoded in the library
   - Recommendation: The planner should budget one task to inspect `@empoweredvote/ev-ui/RadarChartCore` props before assuming color overrides are possible. If not accepted as props, the warm palette applies only to the topic card left borders and badges — not the radar spokes.

3. **Backend deploy sequencing for judicial_role field**
   - What we know: `judicial_role` must be added to `getCompassTopics()` SELECT for sub-role filtering to work
   - What's unclear: Whether the backend change can ship atomically with the frontend change, or must precede it
   - Recommendation: Plan 28-01 should have two tasks: (task 1) backend compassService.ts change + deploy, (task 2) frontend Profile.jsx/CandidateProfile.jsx/CompassCard.jsx changes that use judicial_role. Sequential dependency.

---

## Sources

### Primary (HIGH confidence)
- `C:\Transparent Motivations\essentials\src\pages\Profile.jsx` — districtScope derivation (lines 220-227), isJudge guard (lines 198-217), CompassCard usage (lines 230-237)
- `C:\Transparent Motivations\essentials\src\pages\CandidateProfile.jsx` — districtScope derivation (lines 171-177), missing JUDICIAL arm confirmed
- `C:\Transparent Motivations\essentials\src\components\CompassCard.jsx` — scopedTopics filter (lines 37-44), `applies_judicial` key (line 41), section header pattern (lines 177-181)
- `C:\EV-Accounts\backend\src\lib\compassService.ts` — `judicial_role` NOT in SELECT (line 111), `applies_judicial` computed (lines 159-161), full topic return shape (lines 163-181)
- `C:\EV-Accounts\backend\migrations\113_judicial_compass_topics.sql` — all 8 topic_keys confirmed, judicial_role values confirmed
- `C:\EV-Accounts\backend\migrations\112_judicial_compass_schema.sql` — judicial_role column definition confirmed
- `C:\Focused Communities\supabase\migrations\20260504000002_phase24_companion_communities.sql` — exact INSERT pattern, verified working
- `.planning/phases/24-companion-focused-communities/24-RESEARCH.md` — connect.communities schema, migration filename convention
- `.planning/phases/27-judicial-compass-db/27-VERIFICATION.md` — Phase 27 complete; 8 topics/40 stances/8 roles verified 6/6
- `C:\Transparent Motivations\essentials\src\index.css` — design token palette (--ev-teal, --ev-coral, ev-navy, etc.)

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — applies_judicial wiring confirmed live, migration 113 applied 2026-05-07
- `C:\EV-Accounts\backend\src\lib\electionService.ts` — position_name field available in candidateData, inferDistrictType confirms 'judge'/'justice' → JUDICIAL

---

## Metadata

**Confidence breakdown:**
- Frontend file locations and current state: HIGH — read directly from source
- Gap: judicial_role absent from API: HIGH — confirmed by SELECT inspection
- Gap: CandidateProfile.jsx missing JUDICIAL arm: HIGH — confirmed line 175-176
- Gap: isJudge guard blocks judicial compass: HIGH — confirmed lines 198-217
- Community migration pattern: HIGH — identical to Phase 24 which is already applied
- Slug collisions: HIGH — grep confirmed 0 occurrences across all Focused Communities migrations
- Notch color props on RadarChartCore: LOW — library not inspected; marked as open question
- Exact burnt orange hex values: MEDIUM — Claude discretion per CONTEXT.md; values chosen to be cohesive

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (stable codebase; no fast-moving external dependencies)
